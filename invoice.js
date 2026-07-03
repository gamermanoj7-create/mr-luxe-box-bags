// =========================================
// MR LUXE BOX & BAGS
// PROFESSIONAL INVOICE V2
// PART 1
// =========================================

async function downloadInvoice() {

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
    });

    const order = JSON.parse(
        localStorage.getItem("lastOrder")
    );

    if (!order) {
        alert("Invoice not found!");
        return;
    }

    // =========================
    // LOGO
    // =========================

    const logo = new Image();
    logo.src = "IMAGES/logo.png";

    await new Promise((resolve, reject) => {
        logo.onload = resolve;
        logo.onerror = reject;
    });

    doc.addImage(
        logo,
        "PNG",
        15,
        10,
        28,
        28
    );

    // =========================
    // COMPANY HEADER
    // =========================

    doc.setDrawColor(212,175,55);
    doc.setLineWidth(0.6);
    doc.line(15,42,195,42);

    doc.setFont("helvetica","bold");
    doc.setFontSize(20);

    doc.text(
        "MR LUXE BOX & BAGS",
        50,
        18
    );

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "Premium Jewellery Packaging",
        50,
        24
    );

    doc.text(
        "Kalyani, Nadia, West Bengal - 741249",
        50,
        30
    );

    doc.text(
        "India",
        50,
        35
    );

    doc.text(
        "Phone : +91 7029714746",
        145,
        24
    );

    doc.text(
        "GST : Not Registered",
        145,
        30
    );

    // =========================
    // INVOICE DETAILS
    // =========================

    const invoiceNo =
        order.invoiceNumber ||
        "INV-" +
        Date.now();

    doc.setFont("helvetica","bold");
    doc.setFontSize(16);

    doc.text(
        "TAX INVOICE",
        15,
        52
    );

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "Invoice No : " + invoiceNo,
        15,
        60
    );

    doc.text(
        "Date : " +
        new Date().toLocaleDateString("en-IN"),
        15,
        66
    );

    doc.text(
        "Order ID : " +
        (order.orderId || "-"),
        15,
        72
    );

    // =========================
    // CUSTOMER DETAILS
    // =========================

    doc.setFillColor(248,248,248);

    doc.roundedRect(
        15,
        78,
        180,
        36,
        2,
        2,
        "F"
    );

    doc.setFont("helvetica","bold");
    doc.setFontSize(12);

    doc.text(
        "Customer Details",
        20,
        87
    );

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    doc.text(
        "Name : " +
        (order.customerName || "-"),
        20,
        95
    );

    doc.text(
        "Phone : " +
        (order.phone || "-"),
        20,
        101
    );

    doc.text(
        "Address : " +
        (order.address || "-"),
        20,
        107
    );

    let startY = 122;
        // =========================
    // PRODUCT TABLE
    // =========================

    const tableData = [];

    (order.products || []).forEach((item) => {

        tableData.push([

            item.name || "-",

            item.quantity || 0,

            "₹" + (item.price || 0),

            "₹" + (item.subtotal || 0)

        ]);

    });

    doc.autoTable({

        startY: startY,

        head: [[

            "Product",

            "Qty",

            "Price",

            "Total"

        ]],

        body: tableData,

        theme: "grid",

        headStyles: {

            fillColor: [0,0,0],

            textColor: [255,215,0],

            fontStyle: "bold",

            halign: "center"

        },

        bodyStyles: {

            textColor: [40,40,40],

            fontSize: 10

        },

        alternateRowStyles: {

            fillColor: [248,248,248]

        },

        columnStyles: {

            0: { cellWidth: 85 },

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

    // =========================
    // GRAND TOTAL BOX
    // =========================

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

        "₹" + (order.finalGrandTotal || 0),

        170,

        y + 7

    );

    doc.setTextColor(0,0,0);

    y += 25;
        // =========================
    // PAYMENT DETAILS
    // =========================

    doc.setFont("helvetica","bold");
    doc.setFontSize(12);

    doc.text(
        "Payment Details",
        15,
        y
    );

    doc.setFont("helvetica","normal");
    doc.setFontSize(10);

    y += 8;

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

    y += 6;

    doc.text(
        "Phone : +91 7029714746",
        15,
        y
    );

    // =========================
    // QR PLACEHOLDER
    // =========================

    doc.setDrawColor(180);

    doc.rect(
        145,
        y - 20,
        40,
        40
    );

    doc.setFontSize(9);

    doc.text(
        "UPI QR",
        156,
        y
    );

    y += 28;

    // =========================
    // FOOTER
    // =========================

    doc.setDrawColor(212,175,55);

    doc.line(
        15,
        y,
        195,
        y
    );

    y += 10;

    doc.setFont("helvetica","bold");
    doc.setFontSize(13);

    doc.text(
        "Thank You For Your Order!",
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
        "Premium Jewellery Packaging",
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

    y += 12;

    doc.setFont("helvetica","bold");

    doc.text(
        "Authorized Signature",
        145,
        y
    );
        // =========================
    // SAVE PDF
    // =========================

    const fileName =
        (order.invoiceNumber ||
        order.orderId ||
        "Invoice") + ".pdf";

    try {

        doc.save(fileName);

    } catch (error) {

        console.error(error);

        alert(
            "Invoice PDF তৈরি করা যায়নি।"
        );

    }

}

// =========================
// GLOBAL FUNCTION
// =========================

window.downloadInvoice = downloadInvoice;