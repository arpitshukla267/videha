import { Department } from "../../models/Department";
import { User } from "../../models/User";
import { Lead } from "../../models/Lead";
import { AppError } from "../../utils/AppError";
import { assertObjectId } from "../../utils/objectId";
import { serializeDepartment } from "../../utils/serializers";
import { applyOptimisticUpdate, parseRevision } from "../../utils/concurrency";
import { writeAudit } from "../../services/audit.service";
import type { AuthUser } from "../../middleware/auth";

function lean(doc: { toObject: () => Record<string, unknown> }) {
  return doc.toObject() as Record<string, unknown>;
}

export async function listDepartments(status?: string) {
  const filter: Record<string, unknown> = {};
  if (status && status !== "all") filter.status = status;
  const docs = await Department.find(filter).sort({ name: 1 });
  return docs.map((d) => serializeDepartment(lean(d)));
}

export async function createDepartment(
  data: { name: string; description?: string },
  actor: AuthUser,
) {
  if (!data.name?.trim()) throw new AppError("Department name is required.", 400);

  const doc = await Department.create({
    name: data.name.trim(),
    description: data.description || "",
    status: "active",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Department Created",
    entity: "Setting",
    entityId: String(doc._id),
    details: `Created department ${doc.name}.`,
  });

  return serializeDepartment(lean(doc));
}

export async function updateDepartment(
  id: string,
  data: { name?: string; description?: string },
  actor: AuthUser,
) {
  assertObjectId(id, "department id");
  const expectedRevision = parseRevision(data as Record<string, unknown>);
  const setFields: Record<string, unknown> = {};

  const existing = await Department.findById(id).select("name");
  if (!existing) throw new AppError("Department not found.", 404);

  if (data.name !== undefined) setFields.name = data.name.trim() || existing.name;
  if (data.description !== undefined) setFields.description = data.description;

  if (Object.keys(setFields).length === 0) {
    const doc = await Department.findById(id);
    if (!doc) throw new AppError("Department not found.", 404);
    return serializeDepartment(lean(doc));
  }

  const doc = await applyOptimisticUpdate(Department, id, expectedRevision, setFields, {
    notFoundMessage: "Department not found.",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Department Updated",
    entity: "Setting",
    entityId: String(doc._id),
    details: `Updated department ${doc.name}.`,
  });

  return serializeDepartment(lean(doc));
}

export async function setDepartmentStatus(
  id: string,
  status: "active" | "inactive",
  actor: AuthUser,
  body: Record<string, unknown> = {},
) {
  assertObjectId(id, "department id");
  if (status !== "active" && status !== "inactive") {
    throw new AppError("Invalid status value.", 400);
  }

  const expectedRevision = parseRevision(body);
  const doc = await applyOptimisticUpdate(Department, id, expectedRevision, { status }, {
    notFoundMessage: "Department not found.",
  });

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: status === "active" ? "Department Activated" : "Department Deactivated",
    entity: "Setting",
    entityId: String(doc._id),
    details: `${status === "active" ? "Activated" : "Deactivated"} department ${doc.name}.`,
  });

  return serializeDepartment(lean(doc));
}

export async function deleteDepartment(id: string, actor: AuthUser) {
  assertObjectId(id, "department id");
  const doc = await Department.findById(id);
  if (!doc) throw new AppError("Department not found.", 404);

  const [userCount, leadCount] = await Promise.all([
    User.countDocuments({ departmentId: id }),
    Lead.countDocuments({ departmentId: id }),
  ]);

  if (userCount > 0 || leadCount > 0) {
    throw new AppError(
      "Cannot delete department while users or leads reference it. Deactivate it instead.",
      409,
      "DEPARTMENT_IN_USE",
    );
  }

  await doc.deleteOne();

  await writeAudit({
    userId: actor.id,
    userName: actor.name,
    userRole: actor.roleName,
    action: "Department Deleted",
    entity: "Setting",
    entityId: id,
    details: `Deleted department ${doc.name}.`,
  });
}
