const multer = require('multer');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (req.path === ('/messages' || '/users')) cb(null, `./uploads${req.path}/`);
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + file.filename);
  },
});

const mimetypes = ['image/png', 'image/jpg', 'image/jpeg'];
const fileFilter = (req, file, cb) => {
  if (mimetypes.includes(file.mimetype)) {
    // null for errors
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter,
});

module.exports = upload;
