// lib/cloudinary.ts
export function cloudinaryUrl(
  publicId: string,
  opts?: { folder?: string; withExt?: boolean; transformations?: string[]; version?: string }
) {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const folderEnv = process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER || "";
  const folder = (opts?.folder ?? folderEnv).replace(/^\/+|\/+$/g, "");
  const prefix = folder ? `${folder}/` : "";

  const t = (
    opts?.transformations?.length ? opts.transformations : ["f_auto", "q_auto"]
  ).join(",");

  // Se withExt=true, força ".jpg" no final
  const id = opts?.withExt ? `${publicId}.jpg` : publicId;

  // Adiciona versão se fornecida
  const version = opts?.version ? `v${opts.version}/` : "";

  return `https://res.cloudinary.com/${cloud}/image/upload/${version}${t}/${prefix}${id}`;
}

// Função para gerar URL da imagem do produto baseada no código de barras
export function getProductImageUrl(barcode?: string | null) {
  if (!barcode) return null;
  
  // URL simples sem transformações para compatibilidade
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  return `https://res.cloudinary.com/${cloud}/image/upload/v1744931877/${barcode}.jpg`;
}

// Função para verificar se uma imagem existe no Cloudinary
export async function checkImageExists(imageUrl: string): Promise<boolean> {
  try {
    const response = await fetch(imageUrl, { 
      method: 'HEAD',
      mode: 'cors',
      cache: 'no-cache'
    });
    return response.ok;
  } catch (error) {
    console.error('Erro ao verificar imagem:', error);
    return false;
  }
}