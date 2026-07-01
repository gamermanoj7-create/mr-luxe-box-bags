// =====================================
// MR LUXE BOX & BAGS
// CLOUDINARY UPLOAD
// PART 1
// =====================================

// আপনার Cloud Name
const CLOUD_NAME = "nx1dc1j1";

// আপনার Unsigned Upload Preset
const UPLOAD_PRESET = "mr_luxe_upload";

// Upload URL
const CLOUDINARY_URL =
`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

// Upload করা File-এর URL
let uploadedDesignURL = "";

// =====================================
// FILE INPUT
// =====================================

const designInput =
document.getElementById("designFile");

const previewBox =
document.getElementById("previewBox");

const progressBar =
document.getElementById("uploadProgress");
// =====================================
// PART 2
// FILE SELECT + IMAGE PREVIEW
// =====================================

designInput.addEventListener("change", async () => {

    const file = designInput.files[0];

    if (!file) return;

    // Preview শুধুমাত্র Image হলে দেখাবে
    if (file.type.startsWith("image/")) {

        const reader = new FileReader();

        reader.onload = function (e) {

            previewBox.innerHTML = `
                <img
                    src="${e.target.result}"
                    style="
                        width:220px;
                        max-width:100%;
                        border-radius:12px;
                        border:2px solid gold;
                        margin-top:15px;
                    ">
            `;

        };

        reader.readAsDataURL(file);

    } else {

        previewBox.innerHTML = `
            <p style="
                color:#111;
                font-weight:bold;
                margin-top:15px;
            ">
                ✅ ${file.name}
            </p>
        `;

    }

    await uploadToCloudinary(file);

});

// =====================================
// CLOUDINARY UPLOAD
// =====================================

async function uploadToCloudinary(file){

    progressBar.style.width = "10%";

    const formData = new FormData();

    formData.append("file", file);

    formData.append(
        "upload_preset",
        UPLOAD_PRESET
    );
    // =====================================
// PART 3
// UPLOAD TO CLOUDINARY
// =====================================

    try{

        const response = await fetch(
            CLOUDINARY_URL,
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if(data.secure_url){

            uploadedDesignURL = data.secure_url;

            progressBar.style.width = "100%";

            progressBar.style.background = "#28a745";

            console.log(
                "Upload Success:",
                uploadedDesignURL
            );

        }else{

            alert("Upload Failed!");

            console.log(data);

            progressBar.style.width = "0%";

        }

    }catch(error){

        console.error(error);

        alert("File Upload Error!");

        progressBar.style.width = "0%";

    }

}
// =====================================
// PART 4
// PLACE ORDER
// =====================================

async function placeOrder(){

    const name =
    document.getElementById("name").value.trim();

    const phone =
    document.getElementById("phone").value.trim();

    const address =
    document.getElementById("address").value.trim();

    const state =
    document.getElementById("state").value.trim();

    const pincode =
    document.getElementById("pincode").value.trim();

    const payment =
    document.getElementById("payment").value;

    if(
        !name ||
        !phone ||
        !address ||
        !payment
    ){

        alert("Please fill all details.");

        return;

    }

    let cart =
    JSON.parse(
        localStorage.getItem("cart")
    ) || [];

    let totalQty = 0;

    let grandTotal = 0;

    cart.forEach(item=>{

        totalQty += Number(item.quantity);

        grandTotal +=
        Number(item.quantity) *
        Number(item.price);

    });

    await addDoc(

        collection(db,"orders"),

        {

            customerName:name,

            phone:phone,

            address:address,

            state:state,

            pincode:pincode,

            paymentMethod:payment,

            products:cart,

            totalProducts:totalQty,

            grandTotal:grandTotal,

            designURL:uploadedDesignURL,

            orderStatus:"Pending",

            orderDate:new Date()

        }

    );
    localStorage.setItem(
            "lastOrder",
            JSON.stringify({

                customerName: name,

                phone: phone,

                address: address,

                state: state,

                pincode: pincode,

                paymentMethod: payment,

                products: cart,

                totalProducts: totalQty,

                grandTotal: grandTotal,

                designURL: uploadedDesignURL

            })

        );

        localStorage.removeItem("cart");

        alert("Order Placed Successfully!");

        window.location.href = "success.html";

    }

    catch(error){

        console.error(error);

        alert(
            "Order Failed!\n\n" +
            error.message
        );

    }

}

// =====================================
// GLOBAL
// =====================================

window.placeOrder = placeOrder;