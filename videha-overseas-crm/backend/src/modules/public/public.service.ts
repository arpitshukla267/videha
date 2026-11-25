import { Lead } from "../../models/Lead";
import { LeadActivity } from "../../models/LeadActivity";
import { nextLeadCode, nextRfqId } from "../../utils/codes";
import { AppError } from "../../utils/AppError";
import { determineLeadAssignment } from "../../services/assignment.service";
import { createNotification } from "../../services/notification.service";
import { optionalObjectId } from "../../utils/objectId";

export interface CreateRfqInput {
  name: string;
  company: string;
  country: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  whatsAppNumber?: string;
  product?: string;
  products?: string[];
  grade?: string;
  quantity?: string;
  packaging?: string;
  port?: string;
  destinationPort?: string;
  incoterm?: string;
  tradeIncoTerms?: string;
  sampleRequired?: boolean | string;
  containerType?: string;
  notes?: string;
  additionalRequirement?: string;
  source?: string;
  leadSource?: string;
  assignedToId?: string | null;
}

export async function createPublicRfq(body: CreateRfqInput) {
  const name = String(body.name || "").trim();
  const company = String(body.company || "").trim();
  const country = String(body.country || "").trim();
  const email = String(body.email || "").toLowerCase().trim();
  const phone = String(body.phone || body.phoneNumber || "").trim();

  if (!name || !company || !country || (!email && !phone)) {
    throw new AppError(
      "Name, company, country, and at least an email or phone number are required.",
      400,
    );
  }

  let productText = String(body.product || "").trim();
  if (!productText && Array.isArray(body.products) && body.products.length > 0) {
    productText = body.products.map(String).join(", ");
  }
  if (!productText) productText = "Makhana / Foxnut";

  const grade = String(body.grade || "").trim();
  const quantity = String(body.quantity || "").trim();
  const packaging = String(body.packaging || "").trim();
  const port = String(body.port || body.destinationPort || "").trim();
  const incoterm = String(body.incoterm || body.tradeIncoTerms || "").trim();
  const notes = String(body.notes || body.additionalRequirement || "").trim();
  const containerType = String(body.containerType || "20ft FCL").trim();
  const source = String(body.source || body.leadSource || "Website RFQ").trim();

  let sampleRequired: boolean | string = false;
  if (body.sampleRequired !== undefined && body.sampleRequired !== null) {
    if (typeof body.sampleRequired === "boolean") {
      sampleRequired = body.sampleRequired;
    } else {
      sampleRequired = String(body.sampleRequired).trim();
    }
  }

  // Generate unique RFQ ID: RFQ-YYYY-XXXX
  const rfqId = await nextRfqId();
  const leadCode = await nextLeadCode();

  // Automatic or Manual Assignment
  let assignedToId = optionalObjectId(body.assignedToId || null);
  let assignmentDetails: Record<string, unknown>;

  if (assignedToId) {
    assignmentDetails = {
      assignedAt: new Date(),
      assignedBy: "manual",
      assignedRule: "Manual assignment on submission",
      assignedById: null,
    };
  } else {
    const autoResult = await determineLeadAssignment({
      country,
      product: productText,
      productInterest: productText,
    });
    assignedToId = autoResult.assignedToId ? String(autoResult.assignedToId) : null;
    assignmentDetails = autoResult.assignmentDetails;
  }

  // 1. SAVE LEAD IN DATABASE BEFORE ANY NOTIFICATION/EMAIL (CRITICAL REQUIREMENT)
  const lead = await Lead.create({
    leadCode,
    rfqId,
    name,
    company,
    phoneNumber: phone,
    whatsAppNumber: String(body.whatsAppNumber || phone).trim(),
    email,
    country,
    source,
    productInterest: productText,
    product: productText,
    grade,
    quantity,
    packaging,
    port,
    incoterm,
    sampleRequired,
    containerType,
    assignmentDetails,
    status: "New Lead",
    priority: "Medium",
    assignedToId,
    notes,
    createdById: null,
    archived: false,
  });

  // 2. Activity log & notification (wrapped in try/catch to guarantee lead is persisted even if notifications fail)
  try {
    await LeadActivity.create({
      leadId: lead._id,
      type: "created",
      title: "RFQ Received",
      description: `New RFQ registered as ${rfqId} (${leadCode}) via ${source}.`,
      performedById: null,
      performedByName: "Website RFQ System",
    });

    if (assignedToId) {
      await LeadActivity.create({
        leadId: lead._id,
        type: "assigned",
        title: "Lead Assigned",
        description: `Assigned via ${assignmentDetails.assignedRule || assignmentDetails.assignedBy}.`,
        performedById: null,
        performedByName: "Automatic Assignment Engine",
      });

      await createNotification({
        userId: String(assignedToId),
        title: "New RFQ Assigned",
        message: `New RFQ ${rfqId} from ${company} (${country}) has been assigned to you.`,
        type: "lead_assigned",
        linkUrl: `/leads/${lead._id}`,
      });
    }
  } catch (notificationError) {
    console.error(
      "[CRM Public RFQ] Notification or activity creation warning (lead was safely saved):",
      notificationError,
    );
  }

  return {
    id: String(lead._id),
    leadCode: lead.leadCode,
    rfqId: lead.rfqId,
    name: lead.name,
    company: lead.company,
    country: lead.country,
    email: lead.email,
    phoneNumber: lead.phoneNumber,
    product: lead.product,
    grade: lead.grade,
    quantity: lead.quantity,
    packaging: lead.packaging,
    port: lead.port,
    incoterm: lead.incoterm,
    sampleRequired: lead.sampleRequired,
    containerType: lead.containerType,
    source: lead.source,
    status: lead.status,
    assignedToId: lead.assignedToId ? String(lead.assignedToId) : null,
    assignmentDetails: lead.assignmentDetails,
    createdAt: lead.createdAt.toISOString(),
  };
}
