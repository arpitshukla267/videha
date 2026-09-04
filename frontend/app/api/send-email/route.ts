import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(request: Request) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Email service is not configured." },
        { status: 500 },
      );
    }

    const body = await request.json();

    const {
      name,
      company,
      email,
      phone,
      country,
      products = [],
      services = [],
      grade,
      quantity,
      monthlyRequirement,
      packaging,
      privateLabel,
      port,
      incoterm,
      sampleRequired,
      additionalRequirement,
    } = body;

    if (
      !name ||
      !company ||
      !email ||
      !phone ||
      !country ||
      !quantity ||
      !port ||
      !privateLabel ||
      !incoterm ||
      !sampleRequired ||
      !Array.isArray(products) ||
      products.length === 0
    ) {
      return NextResponse.json(
        { success: false, error: "Please complete all required fields." },
        { status: 400 },
      );
    }

    const safe = (value: unknown) => escapeHtml(String(value ?? ""));
    const productList = products.map((p: unknown) => safe(p)).join(", ");
    const serviceList = Array.isArray(services)
      ? services.map((s: unknown) => safe(s)).join(", ")
      : "";

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: ["info@videhaoverseas.com"],
      replyTo: safe(email),
      subject: `New Buyer Enquiry — ${safe(company)}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>New International Buyer Enquiry</h2>

          <p><strong>Full Name:</strong> ${safe(name)}</p>
          <p><strong>Company Name:</strong> ${safe(company)}</p>
          <p><strong>Business Email:</strong> ${safe(email)}</p>
          <p><strong>WhatsApp / Phone:</strong> ${safe(phone)}</p>
          <p><strong>Country:</strong> ${safe(country)}</p>
          <p><strong>Product Required:</strong> ${productList}</p>
          <p><strong>Service Required:</strong> ${serviceList || "None"}</p>
          <p><strong>Product Grade / Specification:</strong> ${safe(grade)}</p>
          <p><strong>Required Quantity:</strong> ${safe(quantity)}</p>
          <p><strong>Monthly Requirement:</strong> ${safe(monthlyRequirement)}</p>
          <p><strong>Packaging Requirement:</strong> ${safe(packaging)}</p>
          <p><strong>Private Label Required:</strong> ${safe(privateLabel)}</p>
          <p><strong>Destination Port:</strong> ${safe(port)}</p>
          <p><strong>Preferred Incoterm:</strong> ${safe(incoterm)}</p>
          <p><strong>Sample Required:</strong> ${safe(sampleRequired)}</p>

          <hr style="border: 0; border-top: 1px solid #ddd; margin: 24px 0;" />

          <p><strong>Additional Requirement:</strong></p>
          <p>${safe(additionalRequirement) || "None"}</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        { success: false, error: "Unable to send enquiry right now." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    console.error("Send email error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to send enquiry right now." },
      { status: 500 },
    );
  }
}
