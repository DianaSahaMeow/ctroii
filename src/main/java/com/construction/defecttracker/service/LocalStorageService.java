package com.construction.defecttracker.service;

import com.construction.defecttracker.config.StorageProperties;
import jakarta.annotation.PostConstruct;
import net.coobird.thumbnailator.Thumbnails;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "app.upload.type", havingValue = "local", matchIfMissing = true)
public class LocalStorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(LocalStorageService.class);
    private final Path rootLocation;

    public LocalStorageService(StorageProperties properties) {
        this.rootLocation = Paths.get(properties.getDir()).toAbsolutePath().normalize();
    }

    @Override
    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(this.rootLocation);
            log.info("Локальное файловое хранилище инициализировано по пути: {}", this.rootLocation);
        } catch (IOException e) {
            throw new RuntimeException("Не удалось инициализировать директорию для хранения файлов", e);
        }
    }

    @Override
    public String storeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Файл пуст или отсутствует");
        }

        String originalFilename = StringUtils.cleanPath(Objects.requireNonNullElse(file.getOriginalFilename(), "photo.jpg"));
        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex);
        } else {
            extension = ".jpg";
        }

        String storedFileName = UUID.randomUUID() + extension;
        Path targetLocation = this.rootLocation.resolve(storedFileName).normalize();

        if (!targetLocation.getParent().equals(this.rootLocation)) {
            throw new SecurityException("Попытка сохранения файла за пределами целевой папки");
        }

        try {
            String contentType = file.getContentType();
            // Если изображение и размер больше 1MB, дополнительно оптимизируем на бэкенде
            if (contentType != null && contentType.startsWith("image/") && file.getSize() > 1024 * 1024) {
                try {
                    Thumbnails.of(file.getInputStream())
                            .size(1920, 1920)
                            .outputQuality(0.85)
                            .toFile(targetLocation.toFile());
                    log.info("Изображение сжато и сохранено: {}", storedFileName);
                    return storedFileName;
                } catch (Exception e) {
                    log.warn("Не удалось сжать через Thumbnailator, сохранение в исходном виде: {}", e.getMessage());
                }
            }

            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }
            log.info("Файл успешно сохранен: {}", storedFileName);
            return storedFileName;
        } catch (IOException e) {
            throw new RuntimeException("Не удалось сохранить файл: " + storedFileName, e);
        }
    }

    @Override
    public Resource loadFileAsResource(String fileName) {
        try {
            Path filePath = this.rootLocation.resolve(fileName).normalize();
            if (!filePath.getParent().equals(this.rootLocation)) {
                throw new SecurityException("Несанкционированный доступ к файловой системе");
            }

            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Файл не найден или недоступен для чтения: " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Некорректный URI файла: " + fileName, e);
        }
    }

    @Override
    public void deleteFile(String fileName) {
        try {
            Path filePath = this.rootLocation.resolve(fileName).normalize();
            if (filePath.getParent().equals(this.rootLocation)) {
                Files.deleteIfExists(filePath);
            }
        } catch (IOException e) {
            log.error("Ошибка удаления файла: {}", fileName, e);
        }
    }
}
