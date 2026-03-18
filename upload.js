import multer from 'multer';


// Set up multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

// Create multer instance with file size limit (10MB)
const upload = multer({ storage: storage, limits: {
        fileSize: 20 * 1024 * 1024
}});



export default upload
