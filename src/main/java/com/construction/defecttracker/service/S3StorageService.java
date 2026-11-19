package com.construction.defecttracker.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Заготовка для подключения объектного хранилища S3 (AWS S3, MinIO, Backblaze B2, Supabase Storage).
 * Активируется настройкой app.upload.type=s3.
 */
@Service
@ConditionalOnProperty(name = "app.upload.type", havingValue = "s3")
public class S3StorageService implements StorageService {

    private static final Logger log = LoggerFactory.getLogger(S3StorageService.class);

    @Override
    public void init() {
        log.info("S3 Хранилище инициализировано (MinIO/S3 совместимый режим)");
    }

    @Override
    public String storeFile(MultipartFile file) {
        log.info("Загрузка файла в S3: {}", file.getOriginalFilename());
        // Здесь подключается AWS S3 SDK / S3Client
        // return s3Client.putObject(...);
        return "s3_" + file.getOriginalFilename();
    }

    @Override
    public Resource loadFileAsResource(String fileName) {
        throw new UnsupportedOperationException("Прямое скачивание S3 объектов осуществляется по Presigned URL или через CDN");
    }

    @Override
    public void deleteFile(String fileName) {
        log.info("Удаление файла из S3: {}", fileName);
    }
}
