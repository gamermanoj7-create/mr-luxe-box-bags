// =======================================
// MR LUXE BOX & BAGS
// PROFESSIONAL INVOICE V3
// PART 1
// =======================================

async function downloadInvoice() {

    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const order = JSON.parse(localStorage.getItem("lastOrder"));

    if (!order) {
        alert("No Invoice Found!");
        return;
    }

    // ==========================
    // LOGO
    // ==========================

    const logo = new Image();
    logo.src = "IMAGES/logo.png";

    try {
        await new Promise((resolve, reject) => {
            logo.onload = resolve;
            logo.onerror = reject;
        });

        doc.addImage(logo, "PNG", 15, 10, 26, 26);

    } catch (e) {
        console.log("Logo not found");
    }

    // ==========================
    // COMPANY HEADER
    // ==========================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MR LUXE BOX & BAGS", 48, 18);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text("Premium Jewellery Packaging", 48, 24);
    doc.text("Kalyani, Nadia, West Bengal - 741249", 48, 30);
    doc.text("India", 48, 36);

    doc.text("Phone : +91 7029714746", 145, 24);
    doc.text("GST : Not Registered", 145, 30);

    // ==========================
    // GOLD LINE
    // ==========================

    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.6);
    doc.line(15, 42, 195, 42);

    // ==========================
    // INVOICE INFO
    // ==========================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("TAX INVOICE", 15, 52);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
        "Invoice No : " +
        (order.invoiceNumber || "-"),
        15,
        60
    );

    doc.text(
        "Order ID : " +
        (order.orderId || "-"),
        15,
        66
    );

    doc.text(
        "Date : " +
        new Date().toLocaleDateString("en-IN"),
        15,
        72
    );

    // ==========================
    // CUSTOMER DETAILS
    // ==========================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text("Customer Details", 15, 84);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text("Name : " + (order.customerName || "-"), 15, 92);
    doc.text("Phone : " + (order.phone || "-"), 15, 98);
    doc.text("Address : " + (order.address || "-"), 15, 104);

    let startY = 115;
        // ==========================
    // PRODUCT TABLE
    // ==========================

    const tableBody = [];

    (order.products || []).forEach((item) => {

        tableBody.push([

            item.name || "-",

            item.quantity || 0,

            "Rs. " + (item.price || 0),

            "Rs. " + (item.subtotal || 0)

        ]);

    });

    doc.autoTable({

        startY: startY,

        head: [[

            "Product",

            "Quantity",

            "Unit Price",

            "Total"

        ]],

        body: tableBody,

        theme: "grid",

        styles: {

            fontSize: 10,

            cellPadding: 4,

            valign: "middle"

        },

        headStyles: {

            fillColor: [0,0,0],

            textColor: [212,175,55],

            halign: "center",

            fontStyle: "bold"

        },

        alternateRowStyles: {

            fillColor: [245,245,245]

        },

        columnStyles: {

            0: { cellWidth: 80 },

            1: { halign: "center" },

            2: { halign: "right" },

            3: { halign: "right" }

        },

        margin: {

            left: 15,

            right: 15

        }

    });

    let y = doc.lastAutoTable.finalY + 12;

    // ==========================
    // GRAND TOTAL
    // ==========================

    doc.setFillColor(212,175,55);

    doc.roundedRect(

        120,

        y,

        75,

        16,

        2,

        2,

        "F"

    );

    doc.setFont("helvetica","bold");

    doc.setFontSize(13);

    doc.setTextColor(0,0,0);

    doc.text(

        "Grand Total",

        126,

        y + 7

    );

    doc.text(

        "Rs. " + (order.finalGrandTotal || 0),

        165,

        y + 7

    );

    doc.setTextColor(0,0,0);

    y += 25;
        // ==========================
    // PAYMENT DETAILS
    // ==========================

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    doc.text("Payment Details", 15, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    y += 8;

    doc.text(
        "Payment Method : " +
        (order.paymentMethod || "-"),
        15,
        y
    );

    y += 6;

    doc.text(
        "UPI ID : 7029714746-2@ybl",
        15,
        y
    );

    y += 6;

    doc.text(
        "GST : Not Registered",
        15,
        y
    );

    // ==========================
    // QR PLACEHOLDER
    // ==========================

    doc.setDrawColor(180);

    doc.rect(
        150,
        y - 18,
        35,
        35
    );

    doc.setFontSize(9);

    doc.text(
        "UPI QR",
        158,
        y
    );

    // ==========================
    // FOOTER
    // ==========================

    y += 28;

    doc.setDrawColor(212,175,55);

    doc.line(
        15,
        y,
        195,
        y
    );

    y += 10;

    doc.setFont("helvetica","bold");
    doc.setFontSize(12);

    doc.text(
        "Thank You For Your Business!",
        15,
        y
    );

    y += 8;

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "MR LUXE BOX & BAGS",
        15,
        y
    );

    y += 6;

    doc.text(
        "Premium Jewellery Packaging Manufacturer",
        15,
        y
    );

    y += 6;

    doc.text(
        "Kalyani, Nadia, West Bengal - 741249",
        15,
        y
    );

    y += 6;

    doc.text(
        "India",
        15,
        y
    );

    doc.setFont("helvetica","bold");

    doc.text(
        "Authorized Signature",
        145,
        y
    );
        // ==========================
    // SAVE PDF
    // ==========================

    const fileName =
        (order.invoiceNumber || "Invoice") +
        ".pdf";

    try {

        doc.save(fileName);

    } catch (error) {

        console.error(error);

        alert("Invoice PDF Download Failed!");

    }

}

// ==========================
// GLOBAL FUNCTION
// ==========================

window.downloadInvoice = downloadInvoice;