/**
 * Клиентский модуль сжатия изображений через HTML5 Canvas.
 * Оптимизирует фотографии с мобильной камеры (10-20 МБ) до ~250-400 КБ
 * перед отправкой на сервер. Экономит трафик на стройплощадке и дисковое пространство.
 */
const ImageCompressor = {
    /**
     * Сжать файл изображения
     * @param {File} file - исходный файл из input
     * @param {number} maxDimension - максимальная ширина или высота (по умолчанию 1400px)
     * @param {number} quality - качество JPEG от 0.1 до 1.0 (по умолчанию 0.82)
     * @returns {Promise<{file: File, originalSize: number, compressedSize: number, previewUrl: string}>}
     */
    compress: function(file, maxDimension = 1400, quality = 0.82) {
        return new Promise((resolve, reject) => {
            if (!file.type.startsWith('image/')) {
                // Если не изображение, возвращаем как есть
                resolve({
                    file: file,
                    originalSize: file.size,
                    compressedSize: file.size,
                    previewUrl: URL.createObjectURL(file)
                });
                return;
            }

            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;

                    // Вычисляем новые пропорции с учетом ограничения maxDimension
                    if (width > height) {
                        if (width > maxDimension) {
                            height = Math.round((height * maxDimension) / width);
                            width = maxDimension;
                        }
                    } else {
                        if (height > maxDimension) {
                            width = Math.round((width * maxDimension) / height);
                            height = maxDimension;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;

                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error("Ошибка кодирования изображения в Canvas"));
                            return;
                        }

                        // Сохраняем имя файла, расширение меняем на .jpg если требуется
                        let newName = file.name;
                        if (!newName.toLowerCase().endsWith('.jpg') && !newName.toLowerCase().endsWith('.jpeg')) {
                            newName = newName.replace(/\.[^/.]+$/, "") + ".jpg";
                        }

                        const compressedFile = new File([blob], newName, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        });

                        const previewUrl = URL.createObjectURL(blob);

                        resolve({
                            file: compressedFile,
                            originalSize: file.size,
                            compressedSize: compressedFile.size,
                            previewUrl: previewUrl
                        });
                    }, 'image/jpeg', quality);
                };
                img.onerror = (err) => reject(err);
            };
            reader.onerror = (err) => reject(err);
        });
    },

    /**
     * Форматирование байтов в читаемый вид (КБ, МБ)
     */
    formatBytes: function(bytes) {
        if (bytes === 0) return '0 Б';
        const k = 1024;
        const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }
};
