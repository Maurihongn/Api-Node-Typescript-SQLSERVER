import multer from 'multer';

export const avatarImageUpload = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define la ubicación para otro tipo de imagen
    cb(null, 'uploads/avatars');
  },
  filename: (req, file, cb) => {
    // Define el nombre del archivo aquí
    cb(null, 'avatar-' + Date.now() + '-' + file.originalname);
  },
});

export const itemImageUpload = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define la ubicación para otro tipo de imagen
    cb(null, 'uploads/items');
  },
  filename: (req, file, cb) => {
    // Define el nombre del archivo aquí
    cb(null, 'item-' + Date.now() + '-' + file.originalname);
  },
});

export const avatarUpload = multer({
  storage: avatarImageUpload,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(new Error('El archivo no es una imagen válido.'));
    }
  },
});
export const itemUpload = multer({
  storage: itemImageUpload,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype == 'image/png' ||
      file.mimetype == 'image/jpg' ||
      file.mimetype == 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(new Error('El archivo no es una imagen válido.'));
    }
  },
});
