import { NextResponse } from "next/server";
import { Resend } from "resend";

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
      containerType = "20ft FCL",
      source = "Website RFQ",
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

    // 1. SAVE EVERY RFQ AS A LEAD IN THE DATABASE BEFORE SENDING EMAIL/NOTIFICATION
    const crmApiUrl =
      process.env.CRM_API_URL ||
      process.env.NEXT_PUBLIC_CRM_API_URL ||
      "http://localhost:5000";

    let crmResult: { rfqId?: string; leadCode?: string; id?: string } | null = null;
    try {
      const crmRes = await fetch(`${crmApiUrl}/api/public/rfq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          email,
          phone,
          country,
          product: productList,
          grade,
          quantity,
          packaging,
          port,
          incoterm,
          sampleRequired,
          notes: additionalRequirement || "",
          containerType,
          source,
        }),
      });

      if (crmRes.ok) {
        const crmJson = await crmRes.json();
        crmResult = crmJson.data;
      } else {
        console.error("CRM RFQ endpoint returned non-200:", crmRes.status, await crmRes.text());
      }
    } catch (crmErr) {
      console.error("Failed to connect to CRM RFQ endpoint:", crmErr);
    }

    // 2. SEND NOTIFICATION EMAIL VIA RESEND (OPTIONAL / NON-BLOCKING FOR LEAD CREATION)
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      try {
        const resend = new Resend(apiKey);
        const rfqTag = crmResult?.rfqId ? ` [${crmResult.rfqId}]` : "";

        await resend.emails.send({
          from: "onboarding@resend.dev",
          to: ["info@videhaoverseas.com"],
          replyTo: safe(email),
          subject: `New Buyer Enquiry${rfqTag} — ${safe(company)}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
              <h2>New International Buyer Enquiry</h2>
              ${crmResult?.rfqId ? `<p><strong>RFQ ID:</strong> ${safe(crmResult.rfqId)}</p>` : ""}
              <p><strong>Full Name:</strong> ${safe(name)}</p>
              <p><strong>Company Name:</strong> ${safe(company)}</p>
              <p><strong>Business Email:</strong> ${safe(email)}</p>
              <p><strong>WhatsApp / Phone:</strong> ${safe(phone)}</p>
              <p><strong>Country:</strong> ${safe(country)}</p>
              <p><strong>Product Required:</strong> ${productList}</p>
              <p><strong>Service Required:</strong> ${serviceList || "None"}</p>
              <p><strong>Product Grade / Specification:</strong> ${safe(grade)}</p>
              <p><strong>Required Quantity:</strong> ${safe(quantity)}</p>
              <p><strong>Container Type:</strong> ${safe(containerType)}</p>
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
      } catch (emailErr) {
        console.error("Resend send error:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      rfqId: crmResult?.rfqId,
      leadCode: crmResult?.leadCode,
      id: crmResult?.id,
    });
  } catch (error) {
    console.error("Send email error:", error);

    return NextResponse.json(
      { success: false, error: "Unable to process enquiry right now." },
      { status: 500 },
    );
  }
}
