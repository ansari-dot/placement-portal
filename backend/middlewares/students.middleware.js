import multer from "multer";

const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null,'uploads/students/')
    },

    filename: (req,file,cb)=>{
        cb(null,Date.now() + '-' + file.originalname)
    },
})

const filterFiles = (req,file,cb)=>{
   
    const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
    ];

    if(allowedTypes.includes(file.mimetype)){
        cb(null,true)
    }
}


const upload = multer({
    storage:storage,
    fileFilter:filterFiles,
    limits:{
        fileSize: 5 * 1024 * 1024, // 5MB
    }
})


export default upload;