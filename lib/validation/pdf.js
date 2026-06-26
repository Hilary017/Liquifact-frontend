// lib/validation/pdf.js
/**
 * Checks whether a File object contains the PDF magic number "%PDF-".
 * @param {File} file - The file to validate.
 * @returns {Promise<boolean>} Resolves to true if the file starts with "%PDF-".
 */
export async function isPdfMagicValid(file) {
  const header = await file.slice(0, 5).arrayBuffer();
  const decoder = new TextDecoder('utf-8');
  const magic = decoder.decode(header);
  return magic === '%PDF-';
}
