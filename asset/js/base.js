/**
 * FixGo AI — Base JavaScript
 * Handles sidebar toggle, expandable nav, profile panel,
 * avatar upload, edit info (only full name), change password.
 * All browser alerts replaced with custom toasts/confirms.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ---------- POPUP MESSAGE SYSTEM (centered, not a corner toast) ----------
    // Renders as a true centered popup with a dim backdrop and a floating
    // icon badge that overlaps the top edge of the card — the same visual
    // language as the confirm dialog and the result modal, so every popup
    // in the app (success, error, info, warning, fix) looks consistent.
    // Same function name/signature as before so every existing
    // showToast(...) call in this file keeps working untouched.
    const TOAST_ICONS = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 13l4 4L19 7"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>',
        fix: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 1 5.4-5.4l-2.6 2.6-2-2z"/></svg>'
    };
    const TOAST_TITLES = {
        success: 'Success',
        error: 'Oops!',
        info: 'Heads up',
        warning: 'Careful',
        fix: 'Working on it'
    };

    // Queue so if several messages fire close together, they show one at a
    // time centered on screen instead of piling up.
    const toastQueue = [];
    let toastBusy = false;

    function getToastLayer() {
        let backdrop = document.getElementById('toast-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'toast-backdrop';
            backdrop.className = 'toast-backdrop';
            document.body.appendChild(backdrop);
        }
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            document.body.appendChild(container);
        }
        return { backdrop, container };
    }

    function showToast(message, type = 'info', duration = 4000) {
        toastQueue.push({ message, type, duration });
        processToastQueue();
    }

    function processToastQueue() {
        if (toastBusy || toastQueue.length === 0) return;
        toastBusy = true;
        const { message, type, duration } = toastQueue.shift();
        renderToast(message, type, duration, () => {
            toastBusy = false;
            processToastQueue();
        });
    }

    function renderToast(message, type, duration, onDone) {
        const { backdrop, container } = getToastLayer();

        let title = TOAST_TITLES[type] || TOAST_TITLES.info;
        let body = message;
        if (message && typeof message === 'object') {
            title = message.title || title;
            body = message.message || '';
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <button class="toast-close" aria-label="Dismiss">&times;</button>
            <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
            <span class="toast-body">
                <span class="toast-title">${title}</span>
                <span class="toast-message">${body}</span>
            </span>
            <span class="toast-progress" style="animation-duration:${duration}ms"></span>
        `;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            backdrop.classList.add('is-visible');
            toast.classList.add('show');
        });

        let dismissed = false;
        function dismiss() {
            if (dismissed) return;
            dismissed = true;
            clearTimeout(timer);
            toast.classList.add('leaving');
            toast.classList.remove('show');
            backdrop.classList.remove('is-visible');
            setTimeout(() => {
                toast.remove();
                onDone();
            }, 320);
        }

        toast.querySelector('.toast-close').addEventListener('click', (e) => {
            e.stopPropagation();
            dismiss();
        });
        backdrop.addEventListener('click', dismiss, { once: true });

        const timer = setTimeout(dismiss, duration);

        return toast;
    }

    // ---------- RESULT / SUCCESS MODAL ----------
    // A bigger, celebratory popup for milestone actions (approvals, big
    // confirmations, etc.) — matches the rounded "Successful" card style
    // with floating decorative shapes and an animated check/x icon.
    // Usage: showResultModal({ type: 'success', title: 'Successful',
    //   message: 'You have approved claim.', buttonText: 'Go to next approval',
    //   onAction: () => {...} })
    function showResultModal({
        type = 'success',
        title = 'Successful',
        message = '',
        buttonText = 'Continue',
        onAction = null,
        emojis = ['🎉', '🔧']
    } = {}) {
        const existing = document.getElementById('result-overlay');
        if (existing) existing.remove();

        const iconSvg = type === 'error'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path class="result-modal__check-path" d="M6 6l12 12M18 6L6 18"/></svg>'
            : type === 'info'
                ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path class="result-modal__check-path" d="M12 8v5M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path class="result-modal__check-path" d="M5 13l4 4L19 7"/></svg>';

        const overlay = document.createElement('div');
        overlay.className = 'result-overlay';
        overlay.id = 'result-overlay';

        overlay.innerHTML = `
            <div class="result-modal type-${type}">
                <button class="result-modal__close" aria-label="Close">&times;</button>
                <span class="result-modal__blob result-modal__blob--1"></span>
                <span class="result-modal__blob result-modal__blob--2"></span>
                <span class="result-modal__blob result-modal__blob--3"></span>
                <span class="result-modal__blob result-modal__blob--4"></span>
                <span class="result-modal__emoji result-modal__emoji--1">${emojis[0] || '🎉'}</span>
                <span class="result-modal__emoji result-modal__emoji--2">${emojis[1] || '🔧'}</span>
                <div class="result-modal__icon-wrap">
                    <span class="result-modal__ring"></span>
                    ${iconSvg}
                </div>
                <h3 class="result-modal__title">${title}</h3>
                <p class="result-modal__message">${message}</p>
                <div class="result-modal__divider"></div>
                <button class="result-modal__cta">${buttonText}</button>
            </div>
        `;
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        requestAnimationFrame(() => overlay.classList.add('is-visible'));

        function close() {
            overlay.classList.remove('is-visible');
            document.body.style.overflow = '';
            setTimeout(() => overlay.remove(), 300);
        }

        overlay.querySelector('.result-modal__close').addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });
        document.addEventListener('keydown', function escHandler(e) {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', escHandler);
            }
        });

        const ctaBtn = overlay.querySelector('.result-modal__cta');
        ctaBtn.addEventListener('click', () => {
            close();
            if (typeof onAction === 'function') onAction();
        });

        return overlay;
    }
    // Expose globally so any page/template can trigger it, e.g.
    // window.showResultModal({ type: 'success', title: 'Successful', message: 'You have approved claim.', buttonText: 'Go to next approval' });
    window.showToast = showToast;
    window.showResultModal = showResultModal;

    // ---------- BUTTON RIPPLE EFFECT ----------
    // Adds a soft material-style ripple to every important button on click.
    function attachRipple(el) {
        el.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            const size = Math.max(rect.width, rect.height);
            ripple.className = 'ripple';
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 650);
        });
    }
    document.querySelectorAll(
        '.btn-primary, .btn-upload, .btn-change, .btn-remove, .profile-panel__warning-btn'
    ).forEach(attachRipple);
    // Ripple-enable buttons created later (e.g. inside modals/toasts)
    document.addEventListener('click', (e) => {
        const target = e.target.closest('.result-modal__cta, #confirm-yes, #confirm-no');
        if (target && !target.dataset.rippled) {
            target.dataset.rippled = 'true';
            attachRipple(target);
        }
    });

    // ---------- CUSTOM CONFIRMATION MODAL (illustrated popup style) ----------
    // Same signature as before — showConfirm(message, callback) — so the
    // avatar-removal call (and any future ones) keep working untouched.
    // Optional 3rd arg lets you customize type/labels/subtitle if needed:
    // showConfirm('Delete this?', cb, { type: 'danger', message: 'This can\'t be undone.', yesText: 'Delete', noText: 'Keep it' })
    function showConfirm(message, callback, options = {}) {
        const existing = document.getElementById('confirm-overlay');
        if (existing) existing.remove();

        const type = options.type || 'warning'; // warning | danger | info
        const subtitle = options.message || '';
        const yesText = options.yesText || 'Yes';
        const noText = options.noText || 'Cancel';

        const iconSvg = type === 'danger'
            ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m-8 0 1 13a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-13"/></svg>'
            : type === 'info'
                ? '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8v5M12 16h.01"/><circle cx="12" cy="12" r="9"/></svg>';

        const overlay = document.createElement('div');
        overlay.id = 'confirm-overlay';
        overlay.className = 'confirm-overlay';

        overlay.innerHTML = `
            <div class="confirm-modal type-${type}">
                <span class="confirm-modal__doodle confirm-modal__doodle--squiggle-1"></span>
                <span class="confirm-modal__doodle confirm-modal__doodle--squiggle-2"></span>
                <span class="confirm-modal__doodle confirm-modal__doodle--dot"></span>
                <div class="confirm-modal__icon-wrap">${iconSvg}</div>
                <h3 class="confirm-modal__title">${message}</h3>
                ${subtitle ? `<p class="confirm-modal__message">${subtitle}</p>` : ''}
                <div class="confirm-modal__actions">
                    <button id="confirm-yes" class="confirm-modal__btn confirm-modal__btn--primary">${yesText}</button>
                    <button id="confirm-no" class="confirm-modal__btn confirm-modal__btn--secondary">${noText}</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';
        requestAnimationFrame(() => overlay.classList.add('is-visible'));

        function closeConfirm(result) {
            overlay.classList.remove('is-visible');
            document.body.style.overflow = '';
            document.removeEventListener('keydown', escHandler);
            setTimeout(() => overlay.remove(), 280);
            callback(result);
        }

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeConfirm(false);
        });
        overlay.querySelector('#confirm-yes').addEventListener('click', () => closeConfirm(true));
        overlay.querySelector('#confirm-no').addEventListener('click', () => closeConfirm(false));

        function escHandler(e) {
            if (e.key === 'Escape') closeConfirm(false);
        }
        document.addEventListener('keydown', escHandler);
    }

    // ---------- SIDEBAR TOGGLE ----------
    const menuToggle = document.getElementById('menuToggle');
    const sidebar = document.getElementById('sidebar');
    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('is-open');
        });
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 960) {
                if (!sidebar.contains(e.target) && e.target !== menuToggle) {
                    sidebar.classList.remove('is-open');
                }
            }
        });
    }

    // ---------- EXPANDABLE NAV ----------
    const expandableItems = document.querySelectorAll('.nav-item--expandable');
    expandableItems.forEach(item => {
        const trigger = item.querySelector('.nav-item__trigger');
        if (trigger) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                expandableItems.forEach(other => {
                    if (other !== item && other.classList.contains('is-open')) {
                        other.classList.remove('is-open');
                    }
                });
                item.classList.toggle('is-open');
            });
        }
    });

    // ---------- PROFILE PANEL ----------
    const profileToggle = document.getElementById('profileToggle');
    const profilePanel = document.getElementById('profilePanel');
    const overlay = document.getElementById('overlay');
    const panelClose = document.getElementById('profilePanelClose');

    function openProfilePanel() {
        profilePanel.classList.add('is-open');
        overlay.classList.add('is-visible');
        document.body.style.overflow = 'hidden';
    }

    function closeProfilePanel() {
        profilePanel.classList.remove('is-open');
        overlay.classList.remove('is-visible');
        document.body.style.overflow = '';
    }

    if (profileToggle && profilePanel && overlay) {
        profileToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            if (profilePanel.classList.contains('is-open')) {
                closeProfilePanel();
            } else {
                openProfilePanel();
            }
        });
        if (panelClose) {
            panelClose.addEventListener('click', closeProfilePanel);
        }
        overlay.addEventListener('click', closeProfilePanel);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && profilePanel.classList.contains('is-open')) {
                closeProfilePanel();
            }
        });
    }

    // ---------- AVATAR ----------
    const avatarUploadInput = document.getElementById('avatarUpload');
    const avatarContainer = document.getElementById('profileAvatar');
    const changeBtn = document.getElementById('changeAvatarBtn');
    const removeBtn = document.getElementById('removeAvatarBtn');

    function updateAvatarDisplay(imageUrl) {
        if (avatarContainer) {
            if (imageUrl) {
                let img = avatarContainer.querySelector('img');
                if (!img) {
                    img = document.createElement('img');
                    img.id = 'profileAvatarImg';
                    avatarContainer.innerHTML = '';
                    avatarContainer.appendChild(img);
                }
                img.src = imageUrl;
                img.alt = 'Profile';
            } else {
                const name = document.getElementById('displayFullName')?.textContent || 'G';
                const initial = name.charAt(0).toUpperCase();
                avatarContainer.innerHTML = `<span id="profileAvatarInitials">${initial}</span>`;
            }
        }
        const topbarAvatar = document.querySelector('.user-menu__avatar');
        if (topbarAvatar) {
            if (imageUrl) {
                topbarAvatar.innerHTML = `<img src="${imageUrl}" alt="Profile" />`;
            } else {
                const name = document.getElementById('displayFullName')?.textContent || 'Guest';
                topbarAvatar.textContent = name.charAt(0).toUpperCase();
            }
        }
        const sidebarAvatar = document.querySelector('.sidebar__user-avatar');
        if (sidebarAvatar) {
            if (imageUrl) {
                sidebarAvatar.innerHTML = `<img src="${imageUrl}" alt="Profile" />`;
            } else {
                const name = document.getElementById('displayFullName')?.textContent || 'Guest';
                sidebarAvatar.textContent = name.charAt(0).toUpperCase();
            }
        }
    }

    const uploadLabel = document.querySelector('.btn-upload');
    if (uploadLabel && avatarUploadInput) {
        uploadLabel.addEventListener('click', () => avatarUploadInput.click());
    }
    if (changeBtn && avatarUploadInput) {
        changeBtn.addEventListener('click', () => avatarUploadInput.click());
    }

    if (avatarUploadInput) {
        avatarUploadInput.addEventListener('change', function(e) {
            const file = this.files[0];
            if (!file) return;

            if (file.size > 5 * 1024 * 1024) {
                showToast('File size exceeds 5MB limit.', 'error');
                this.value = '';
                return;
            }
            if (!file.type.startsWith('image/')) {
                showToast('Please select an image file.', 'error');
                this.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(ev) {
                const imageData = ev.target.result;
                updateAvatarDisplay(imageData);

                const formData = new FormData();
                formData.append('avatar', file);
                fetch('/api/upload-avatar', {
                    method: 'POST',
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.avatar_url) {
                        updateAvatarDisplay(data.avatar_url);
                        showToast('Avatar uploaded successfully!', 'success');
                    } else {
                        showToast('Failed to upload avatar. Please try again.', 'error');
                    }
                })
                .catch(() => showToast('Network error. Please try again.', 'error'));
            };
            reader.readAsDataURL(file);
        });
    }

    if (removeBtn) {
        removeBtn.addEventListener('click', function() {
            showConfirm('Remove your profile picture?', (confirmed) => {
                if (!confirmed) return;
                fetch('/api/remove-avatar', { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            updateAvatarDisplay(null);
                            showToast('Avatar removed.', 'info');
                        } else {
                            showToast('Failed to remove avatar.', 'error');
                        }
                    })
                    .catch(() => showToast('Network error.', 'error'));
            });
        });
    }

    // ---------- EDIT PROFILE (only full name) ----------
    const editInfoForm = document.getElementById('editInfoForm');
    if (editInfoForm) {
        editInfoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const fullName = document.getElementById('editFullName').value.trim();

            if (!fullName) {
                showToast('Full name is required.', 'error');
                return;
            }

            const saveBtn = document.getElementById('saveProfileBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Saving...';

            // Only send full_name – phone is read-only and not editable
            fetch('/api/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ full_name: fullName })
            })
            .then(res => res.json())
            .then(data => {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
                if (data.success) {
                    document.getElementById('displayFullName').textContent = fullName;

                    const sidebarName = document.querySelector('.sidebar__user-name');
                    if (sidebarName) sidebarName.textContent = fullName;
                    const topbarName = document.querySelector('.user-menu__name');
                    if (topbarName) topbarName.textContent = fullName;

                    const hasPic = document.querySelector('#profileAvatar img');
                    if (!hasPic) {
                        const initial = fullName.charAt(0).toUpperCase();
                        const avatarSpan = document.querySelector('#profileAvatarInitials');
                        if (avatarSpan) avatarSpan.textContent = initial;
                        const topbarAvatar = document.querySelector('.user-menu__avatar');
                        if (topbarAvatar && !topbarAvatar.querySelector('img')) {
                            topbarAvatar.textContent = initial;
                        }
                        const sidebarAvatar = document.querySelector('.sidebar__user-avatar');
                        if (sidebarAvatar && !sidebarAvatar.querySelector('img')) {
                            sidebarAvatar.textContent = initial;
                        }
                    }

                    showToast('Profile updated successfully!', 'success');
                } else {
                    showToast(data.message || 'Update failed.', 'error');
                }
            })
            .catch(() => {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save Changes';
                showToast('Network error.', 'error');
            });
        });
    }

    // ---------- CHANGE PASSWORD ----------
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const current = document.getElementById('currentPassword').value;
            const newPass = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (!current || !newPass || !confirm) {
                showToast('Please fill in all password fields.', 'error');
                return;
            }
            if (newPass.length < 6) {
                showToast('New password must be at least 6 characters.', 'error');
                return;
            }
            if (newPass !== confirm) {
                showToast('New passwords do not match.', 'error');
                return;
            }

            const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Updating...';

            fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_password: current, new_password: newPass })
            })
            .then(res => res.json())
            .then(data => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Password';
                if (data.success) {
                    showToast('Password changed successfully!', 'success');
                    changePasswordForm.reset();
                } else {
                    showToast(data.message || 'Password change failed.', 'error');
                }
            })
            .catch(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Update Password';
                showToast('Network error.', 'error');
            });
        });
    }

});