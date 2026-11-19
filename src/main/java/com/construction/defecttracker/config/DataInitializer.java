package com.construction.defecttracker.config;

import com.construction.defecttracker.domain.entity.Apartment;
import com.construction.defecttracker.domain.entity.Defect;
import com.construction.defecttracker.domain.entity.User;
import com.construction.defecttracker.domain.enums.DefectStatus;
import com.construction.defecttracker.domain.enums.Role;
import com.construction.defecttracker.domain.enums.Urgency;
import com.construction.defecttracker.repository.ApartmentRepository;
import com.construction.defecttracker.repository.DefectRepository;
import com.construction.defecttracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final DefectRepository defectRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(
            UserRepository userRepository,
            ApartmentRepository apartmentRepository,
            DefectRepository defectRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.apartmentRepository = apartmentRepository;
        this.defectRepository = defectRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        log.info("Проверка начальных данных системы...");

        User manager = initUser("manager", "manager123", "Иванов А.С. (Начальник участка)", Role.MANAGER);
        User worker1 = initUser("worker1", "worker123", "Петров И.В. (Приемщик)", Role.WORKER);
        User worker2 = initUser("worker2", "worker123", "Сидоров К.М. (Приемщик)", Role.WORKER);

        if (apartmentRepository.count() == 0) {
            log.info("Инициализация демонстрационных квартир и дефектов...");

            // Квартира 1: Подъезд 1, Квартира 14 (В работе, есть срочный дефект)
            Apartment apt14 = new Apartment(1, 14);
            apt14 = apartmentRepository.save(apt14);

            Defect d1 = new Defect(apt14, worker1, "Глубокая трещина в стяжке пола у балконного блока. Перепад высот более 12мм.", Urgency.URGENT);
            d1.setStatus(DefectStatus.NEW);
            d1.setCreatedAt(LocalDateTime.now().minusDays(2).minusHours(3));
            defectRepository.save(d1);

            Defect d2 = new Defect(apt14, worker1, "Не отрегулирована балконная створка, продувание по нижнему контуру уплотнителя.", Urgency.MEDIUM);
            d2.setStatus(DefectStatus.IN_PROGRESS);
            d2.setCreatedAt(LocalDateTime.now().minusDays(1).minusHours(5));
            defectRepository.save(d2);

            // Квартира 2: Подъезд 1, Квартира 15 (В работе)
            Apartment apt15 = new Apartment(1, 15);
            apt15 = apartmentRepository.save(apt15);

            Defect d3 = new Defect(apt15, worker2, "Отсутствует заземляющий проводник в распределительной коробке санузла.", Urgency.URGENT);
            d3.setStatus(DefectStatus.NEW);
            d3.setCreatedAt(LocalDateTime.now().minusHours(4));
            defectRepository.save(d3);

            Defect d4 = new Defect(apt15, worker1, "Царапины на внешнем стекле двухкамерного стеклопакета на кухне.", Urgency.LOW);
            d4.setStatus(DefectStatus.FIXED);
            d4.setCreatedAt(LocalDateTime.now().minusDays(3));
            defectRepository.save(d4);

            // Квартира 3: Подъезд 2, Квартира 42 (Все принято, отправлена в архив)
            Apartment apt42 = new Apartment(2, 42);
            apt42.setArchived(true);
            apt42 = apartmentRepository.save(apt42);

            Defect d5 = new Defect(apt42, worker1, "Люфт ручки межкомнатной двери.", Urgency.LOW);
            d5.setStatus(DefectStatus.ACCEPTED);
            d5.setCreatedAt(LocalDateTime.now().minusDays(10));
            d5.setUpdatedAt(LocalDateTime.now().minusDays(5));
            defectRepository.save(d5);

            Defect d6 = new Defect(apt42, worker2, "Следы строительной смеси на радиаторе отопления.", Urgency.LOW);
            d6.setStatus(DefectStatus.ACCEPTED);
            d6.setCreatedAt(LocalDateTime.now().minusDays(10));
            d6.setUpdatedAt(LocalDateTime.now().minusDays(5));
            defectRepository.save(d6);

            // Квартира 4: Подъезд 2, Квартира 43 (Готова к архивации - все принято)
            Apartment apt43 = new Apartment(2, 43);
            apt43.setArchived(false);
            apt43 = apartmentRepository.save(apt43);

            Defect d7 = new Defect(apt43, worker1, "Не затянута контргайка на стояке ГВС.", Urgency.MEDIUM);
            d7.setStatus(DefectStatus.ACCEPTED);
            d7.setCreatedAt(LocalDateTime.now().minusDays(4));
            d7.setUpdatedAt(LocalDateTime.now().minusDays(1));
            defectRepository.save(d7);

            log.info("Демонстрационные данные успешно созданы.");
        }
    }

    private User initUser(String username, String rawPassword, String fullName, Role role) {
        return userRepository.findByUsername(username).orElseGet(() -> {
            User user = new User(username, passwordEncoder.encode(rawPassword), fullName, role);
            User saved = userRepository.save(user);
            log.info("Создан системный пользователь: {} ({}) с ролью {}", username, fullName, role);
            return saved;
        });
    }
}
