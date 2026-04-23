/**
 * Descripción: Servicios externos para IA (Groq) y optimización/subida de imágenes (vía API propia → Cloudinary).
 */
import { generarContenidoGroq } from './servicioGroq';
import { apiFetch } from './clienteApi';

// --- SERVICIO DE IA (Sin límites) ---

export const generarContenidoIA = async (prompt: string, sistema: string = "Eres un experto en marketing gastronómico.") => {
  try {
    return await generarContenidoGroq(prompt, sistema);
  } catch (error) {
    console.error("Error generando contenido IA:", error);
    throw error;
  }
};

// --- SERVICIO DE IMÁGENES (compresión en cliente + subida firmada en el servidor) ---

const comprimirImagen = (file: File): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1280;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(newFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => resolve(file);
    };
    
    reader.onerror = () => resolve(file);
  });
};

export const subirImagen = async (file: File): Promise<string> => {
  const archivoOptimizado = await comprimirImagen(file);
  const formData = new FormData();
  formData.append('file', archivoOptimizado);

  const response = await apiFetch('/media/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Error al subir imagen (${response.status})`);
  }
  if (data.url) return data.url;
  throw new Error(data.error || 'Error al subir imagen');
};
