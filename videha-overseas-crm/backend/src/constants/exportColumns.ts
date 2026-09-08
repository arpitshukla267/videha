import { formatExportDate, type ExportColumn } from "../utils/csv";

type Row = Record<string, unknown>;

const col = (header: string, key: string): ExportColumn<Row> => ({
  header,
  value: (row) => row[key] ?? "",
});

const dateCol = (header: string, key: string): ExportColumn<Row> => ({
  header,
  value: (row) => formatExportDate(row[key]),
});

export const LEAD_EXPORT_COLUMNS: ExportColumn<Row>[] = [
  col("Lead Code", "leadCode"),
  col("Name", "name"),
  col("Company", "company"),
  col("Phone", "phoneNumber"),
  col("Email", "email"),
  col("Country", "country"),
  col("Product Interest", "productInterest"),
  col("Source", "leadSource"),
  col("Status", "status"),
  col("Priority", "priority"),
  col("Assigned To", "assignedMemberName"),
  col("Department", "department"),
  dateCol("Next Follow-up", "nextFollowUp"),
  dateCol("Created", "createdDate"),
];

export const COMPANY_EXPORT_COLUMNS: ExportColumn<Row>[] = [
  col("Company Code", "companyCode"),
  col("Name", "name"),
  col("Legal Name", "legalName"),
  col("Country", "country"),
  col("City", "city"),
  col("Industry", "industry"),
  col("Website", "website"),
  col("Status", "status"),
  col("Assigned To", "assignedToName"),
  dateCol("Created", "createdAt"),
  dateCol("Updated", "updatedAt"),
];

export const CUSTOMER_EXPORT_COLUMNS: ExportColumn<Row>[] = [
  col("Customer Code", "customerCode"),
  col("Company", "companyName"),
  col("Name", "name"),
  col("Email", "email"),
  col("Phone", "phone"),
  col("WhatsApp", "whatsAppNumber"),
  col("Designation", "designation"),
  col("Primary Contact", "isPrimaryContact"),
  col("Status", "status"),
  dateCol("Created", "createdAt"),
  dateCol("Updated", "updatedAt"),
];

export const FOLLOWUP_EXPORT_COLUMNS: ExportColumn<Row>[] = [
  col("Lead Code", "leadCode"),
  col("Lead Company", "leadCompany"),
  col("Type", "type"),
  col("Status", "status"),
  dateCol("Due At", "dueAt"),
  col("Assigned To", "assignedToName"),
  col("Outcome", "outcome"),
  col("Notes", "notes"),
  dateCol("Completed At", "completedAt"),
  dateCol("Created", "createdAt"),
];

export const QUOTATION_EXPORT_COLUMNS: ExportColumn<Row>[] = [
  col("Quotation Code", "quotationCode"),
  col("Title", "title"),
  col("Status", "status"),
  col("Currency", "currency"),
  col("Subtotal", "subtotal"),
  col("Discount", "discountAmount"),
  col("Tax Rate %", "taxRate"),
  col("Tax Amount", "taxAmount"),
  col("Total", "totalAmount"),
  dateCol("Validity Date", "validityDate"),
  col("Payment Terms", "paymentTerms"),
  col("Lead Code", "leadCode"),
  col("Lead Name", "leadName"),
  col("Company", "companyName"),
  col("Company Country", "companyCountry"),
  col("Customer", "customerName"),
  col("Customer Email", "customerEmail"),
  col("Customer Phone", "customerPhone"),
  col("Linked Order", "orderCode"),
  col("Assigned To", "assignedToName"),
  col("Notes", "notes"),
  dateCol("Sent At", "sentAt"),
  dateCol("Accepted At", "acceptedAt"),
  dateCol("Created", "createdAt"),
];

export const ORDER_EXPORT_COLUMNS: ExportColumn<Row>[] = [
  col("Order Code", "orderCode"),
  col("Customer", "customerName"),
  col("Company", "company"),
  col("Phone", "phone"),
  col("Email", "email"),
  col("Country", "country"),
  col("Products", "products"),
  col("Quantity", "quantity"),
  col("Order Value", "orderValue"),
  col("Currency", "currency"),
  col("Status", "orderStatus"),
  dateCol("Expected Delivery", "expectedDelivery"),
  col("Destination Port", "destinationPort"),
  col("Shipping Carrier", "shippingCarrier"),
  col("Tracking Number", "trackingNumber"),
  col("Assigned To", "assignedMemberName"),
  col("Notes", "notes"),
  dateCol("Created", "createdDate"),
  dateCol("Updated", "updatedAt"),
];
