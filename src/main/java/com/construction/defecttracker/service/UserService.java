package com.construction.defecttracker.service;

import com.construction.defecttracker.domain.entity.User;
import com.construction.defecttracker.dto.UserDto;
import com.construction.defecttracker.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw new SecurityException("Пользователь не авторизован");
        }
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Пользователь не найден: " + username));
    }

    @Transactional(readOnly = true)
    public UserDto getCurrentUserDto() {
        User user = getCurrentUser();
        return new UserDto(user.getId(), user.getUsername(), user.getFullName(), user.getRole());
    }
}
