---
---
    // Central settings configuration - loaded from _data/settings.yml
    // This is the single source of truth for all site settings
    try {
        window.CFL_CONFIG = {{ site.data.settings | jsonify }};
    } catch (e) {
        console.warn('[CFL] Settings config not loaded, using fallbacks');
        window.CFL_CONFIG = {};
    }

    document.addEventListener('DOMContentLoaded', function() {
        function safeGet(storage, key, fallback) {
            try {
                var value = storage.getItem(key);
                return value === null ? fallback : value;
            } catch (e) {
                console.warn('[CFL] Storage get failed', key, e && e.message ? e.message : e);
                return fallback;
            }
        }

        function safeSet(storage, key, value) {
            try {
                storage.setItem(key, value);
            } catch (e) {
                console.warn('[CFL] Storage set failed', key, e && e.message ? e.message : e);
            }
        }

        function safeRemove(storage, key) {
            try {
                storage.removeItem(key);
            } catch (e) {
                console.warn('[CFL] Storage remove failed', key, e && e.message ? e.message : e);
            }
        }

        function safeParse(value, fallback) {
            if (value === null || typeof value === 'undefined') return fallback;
            try {
                return JSON.parse(value);
            } catch (e) {
                console.warn('[CFL] JSON parse failed', e && e.message ? e.message : e);
                return fallback;
            }
        }

        // =====================
        // SIMPLE DARK MODE (15 lines)
        // =====================
        (function() {
            var KEY = 'cfl-dark-mode';
            var html = document.documentElement;

            // Apply saved preference or system preference
            var saved = localStorage.getItem(KEY);
            var prefersDark = saved === 'true' ||
                (saved === null && matchMedia('(prefers-color-scheme:dark)').matches);
            html.dataset.theme = prefersDark ? 'dark' : 'light';

            // Simple toggle function exposed globally
            window.toggleDarkMode = function() {
                var isDark = html.dataset.theme === 'dark';
                html.dataset.theme = isDark ? 'light' : 'dark';
                localStorage.setItem(KEY, isDark ? 'false' : 'true');
            };

            // Check if currently dark
            window.isDarkMode = function() {
                return html.dataset.theme === 'dark';
            };
        })();

        // =====================
        // MOBILE NAVIGATION MENU
        // =====================
        (function initMobileNav() {
            var toggle = document.getElementById('mobile-menu-toggle');
            var nav = document.getElementById('main-nav');

            if (!toggle || !nav) return;

            toggle.addEventListener('click', function() {
                var isOpen = nav.classList.contains('is-open');

                if (isOpen) {
                    nav.classList.remove('is-open');
                    toggle.setAttribute('aria-expanded', 'false');
                } else {
                    nav.classList.add('is-open');
                    toggle.setAttribute('aria-expanded', 'true');
                }
            });

            // Close menu when clicking a nav link
            nav.querySelectorAll('a').forEach(function(link) {
                link.addEventListener('click', function() {
                    nav.classList.remove('is-open');
                    toggle.setAttribute('aria-expanded', 'false');
                });
            });

            // Close menu on escape key
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && nav.classList.contains('is-open')) {
                    nav.classList.remove('is-open');
                    toggle.setAttribute('aria-expanded', 'false');
                    toggle.focus();
                }
            });

            // Close menu when clicking outside
            document.addEventListener('click', function(e) {
                if (nav.classList.contains('is-open') &&
                    !nav.contains(e.target) &&
                    !toggle.contains(e.target)) {
                    nav.classList.remove('is-open');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        })();

        // =====================
        // SETTINGS DRAWER
        // =====================
        (function initDrawer() {
            var drawer = document.getElementById('cfl-drawer');
            var backdrop = document.getElementById('cfl-drawer-backdrop');
            var openBtn = document.getElementById('cfl-nav-settings-btn');
            var closeBtn = document.getElementById('cfl-drawer-close');
            var darkModeToggle = document.getElementById('cfl-dark-mode-toggle');
            var fontSelect = document.getElementById('cfl-drawer-font-select');
            var resetBtn = document.getElementById('cfl-reset-settings');

            if (!drawer || !backdrop) return;

            function openDrawer() {
                drawer.setAttribute('data-open', 'true');
                backdrop.setAttribute('data-open', 'true');
                document.body.style.overflow = 'hidden';
            }

            function closeDrawer() {
                drawer.setAttribute('data-open', 'false');
                backdrop.setAttribute('data-open', 'false');
                document.body.style.overflow = '';
            }

            // Open drawer
            if (openBtn) {
                openBtn.addEventListener('click', openDrawer);
            }

            // Close drawer
            if (closeBtn) {
                closeBtn.addEventListener('click', closeDrawer);
            }
            if (backdrop) {
                backdrop.addEventListener('click', closeDrawer);
            }

            // Escape key closes drawer
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && drawer.getAttribute('data-open') === 'true') {
                    closeDrawer();
                }
            });

            // Dark mode toggle - simple button click
            if (darkModeToggle) {
                darkModeToggle.addEventListener('click', function() {
                    toggleDarkMode();
                });
            }

            // Font select - sync with existing settings if available
            if (fontSelect) {
                var config = window.CFL_CONFIG || {};
                var fontKey = (config.storage_keys && config.storage_keys.font) || 'cfl-font';
                var defaultFont = (config.defaults && config.defaults.font) || 'default';
                var savedFont = safeGet(localStorage, fontKey, defaultFont);
                fontSelect.value = savedFont;

                // Prevent backdrop from closing drawer when clicking select
                fontSelect.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                });

                fontSelect.addEventListener('click', function(e) {
                    e.stopPropagation();
                });

                fontSelect.addEventListener('change', function() {
                    var font = fontSelect.value;
                    // Use the CFL API to apply font (handles loading, CSS vars, and persistence)
                    if (window.CFL && window.CFL.setFont) {
                        window.CFL.setFont(font);
                    } else {
                        // Fallback if CFL API not ready: save to localStorage and dispatch event
                        var config = window.CFL_CONFIG || {};
                        var fontKey = (config.storage_keys && config.storage_keys.font) || 'cfl-font';
                        safeSet(localStorage, fontKey, font);
                        document.dispatchEvent(new CustomEvent('cfl-font-change', { detail: { font: font } }));
                    }
                });
            }

            // Reset settings
            if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                    if (confirm('Reset all settings to defaults?')) {
                        var config = window.CFL_CONFIG || {};
                        var keys = config.storage_keys || {};
                        safeRemove(localStorage, keys.dark_mode || 'cfl-dark-mode');
                        safeRemove(localStorage, keys.font || 'cfl-font');
                        safeRemove(localStorage, keys.theme || 'cfl-theme');
                        // Reset dark mode to light
                        document.documentElement.dataset.theme = 'light';
                        localStorage.setItem('cfl-dark-mode', 'false');
                        var config = window.CFL_CONFIG || {};
                        var defaultFont = (config.defaults && config.defaults.font) || 'default';
                        if (fontSelect) fontSelect.value = defaultFont;
                        if (window.CFLSettings && window.CFLSettings.reset) {
                            window.CFLSettings.reset();
                        }
                        closeDrawer();
                    }
                });
            }
        })();

        // =====================
        // TOC DEFAULT (MOBILE)
        // =====================
        (function initTocCollapse() {
            var tocDetails = document.querySelectorAll('.cfl-toc__details');
            if (!tocDetails.length) return;
            if (window.matchMedia('(max-width: 900px)').matches) {
                for (var i = 0; i < tocDetails.length; i++) {
                    tocDetails[i].removeAttribute('open');
                }
            }
        })();

        // =====================
        // DAILY TIP DISMISS
        // =====================
        (function initDailyTip() {
            var tip = document.getElementById('daily-tip');
            var dismissBtn = document.getElementById('daily-tip-dismiss');
            if (!tip || !dismissBtn) return;

            // Check if already dismissed today
            var dismissedDate = safeGet(localStorage, 'cfl-tip-dismissed', '');
            var today = new Date().toDateString();
            if (dismissedDate === today) {
                tip.hidden = true;
                return;
            }

            dismissBtn.addEventListener('click', function() {
                tip.hidden = true;
                safeSet(localStorage, 'cfl-tip-dismissed', today);
            });
        })();

        // =====================
        // KEYBOARD SHORTCUTS
        // =====================
        (function initKeyboardShortcuts() {
            document.addEventListener('keydown', function(e) {
                // Ignore if user is typing in an input/textarea
                var tag = e.target.tagName.toLowerCase();
                if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable) {
                    return;
                }

                // "/" focuses search
                if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    var searchInput = document.getElementById('wiki-search-input');
                    if (searchInput) {
                        searchInput.focus();
                        searchInput.select();
                    }
                }

                // "d" toggles dark mode
                if (e.key === 'd' && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
                    toggleDarkMode();
                }

                // "," opens settings
                if (e.key === ',' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    var drawer = document.getElementById('cfl-drawer');
                    var backdrop = document.getElementById('cfl-drawer-backdrop');
                    if (drawer && backdrop) {
                        var isOpen = drawer.getAttribute('data-open') === 'true';
                        drawer.setAttribute('data-open', (!isOpen).toString());
                        backdrop.setAttribute('data-open', (!isOpen).toString());
                        document.body.style.overflow = isOpen ? '' : 'hidden';
                    }
                }

                // "?" shows keyboard shortcuts help
                if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    CFL.showKeyboardHelp();
                }
            });
        })();

        // Keyboard shortcuts help modal
        (function initKeyboardHelp() {
            window.CFL = window.CFL || {};

            var helpModal = null;

            function createHelpModal() {
                var modal = document.createElement('div');
                modal.className = 'keyboard-help-modal';
                modal.id = 'keyboard-help-modal';
                modal.innerHTML = [
                    '<div class="keyboard-help-modal__backdrop"></div>',
                    '<div class="keyboard-help-modal__content">',
                    '  <div class="keyboard-help-modal__header">',
                    '    <h2>Keyboard Shortcuts</h2>',
                    '    <button class="keyboard-help-modal__close" aria-label="Close">&times;</button>',
                    '  </div>',
                    '  <div class="keyboard-help-modal__body">',
                    '    <div class="keyboard-help-modal__section">',
                    '      <h3>Navigation</h3>',
                    '      <div class="keyboard-help-modal__row"><kbd>/</kbd><span>Focus search</span></div>',
                    '      <div class="keyboard-help-modal__row"><kbd>Esc</kbd><span>Clear search / close panels</span></div>',
                    '    </div>',
                    '    <div class="keyboard-help-modal__section">',
                    '      <h3>Appearance</h3>',
                    '      <div class="keyboard-help-modal__row"><kbd>d</kbd><span>Toggle dark mode</span></div>',
                    '      <div class="keyboard-help-modal__row"><kbd>,</kbd><span>Open settings</span></div>',
                    '    </div>',
                    '    <div class="keyboard-help-modal__section">',
                    '      <h3>Help</h3>',
                    '      <div class="keyboard-help-modal__row"><kbd>?</kbd><span>Show this help</span></div>',
                    '    </div>',
                    '  </div>',
                    '</div>'
                ].join('');
                document.body.appendChild(modal);
                return modal;
            }

            function showHelp() {
                if (!helpModal) {
                    helpModal = createHelpModal();
                    helpModal.querySelector('.keyboard-help-modal__backdrop').addEventListener('click', hideHelp);
                    helpModal.querySelector('.keyboard-help-modal__close').addEventListener('click', hideHelp);
                }
                helpModal.classList.add('is-open');
                document.body.style.overflow = 'hidden';
                if (CFL.sounds && CFL.sounds.pop) {
                    CFL.sounds.pop();
                }
            }

            function hideHelp() {
                if (helpModal) {
                    helpModal.classList.remove('is-open');
                    document.body.style.overflow = '';
                }
            }

            // Close on Escape
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && helpModal && helpModal.classList.contains('is-open')) {
                    hideHelp();
                }
            });

            CFL.showKeyboardHelp = showHelp;
            CFL.hideKeyboardHelp = hideHelp;
        })();

        // Check for eldritch corruption (the void remembers...)
        (function checkVoidCorruption() {
            var corruption = parseInt(safeGet(localStorage, 'voidCorruption', '0'), 10) || 0;
            if (corruption > 0) {
                document.body.classList.add('eldritch-mode');
                // Whisper to the console...
                if (corruption >= 50) {
                    console.log('%c👁️ The void sees you...', 'color: #8b00ff; font-size: 20px; text-shadow: 0 0 10px #8b00ff;');
                }
                if (corruption >= 100) {
                    console.log('%c🌀 FULLY CONSUMED', 'color: #ff00ff; font-size: 24px; font-weight: bold;');
                }
            }
        })();

        // =====================================================================
        // WEB AUDIO SOUND EFFECTS SYSTEM
        // =====================================================================
        //
        // PURPOSE: Provides synthesized sound effects for UI interactions
        //
        // USAGE:
        //   CFL.sounds.click()      - Quick blip for button clicks
        //   CFL.sounds.success()    - Ascending tones for positive feedback
        //   CFL.sounds.magic()      - Arpeggio for special buttons
        //   CFL.sounds.setEnabled(false)  - Disable all sounds
        //
        // HOW IT WORKS:
        //   Uses Web Audio API to generate tones in real-time via oscillators.
        //   No audio files needed - all sounds are mathematically synthesized.
        //
        // STORAGE:
        //   localStorage.cflSoundsEnabled - 'true'/'false'
        //   localStorage.cflSoundsVolume  - float 0.0-1.0
        //
        // SEE: docs/SOUND-SYSTEM.md for full documentation
        // =====================================================================
        window.CFL = window.CFL || {};

        CFL.sounds = (function() {
            var audioContext = null;
            var enabled = safeGet(localStorage, 'cflSoundsEnabled', 'true') !== 'false';
            var volume = parseFloat(safeGet(localStorage, 'cflSoundsVolume', '0.3')) || 0.3;

            function getContext() {
                if (!audioContext) {
                    audioContext = new (window.AudioContext || window.webkitAudioContext)();
                }
                return audioContext;
            }

            function playTone(frequency, type, duration, volumeMod) {
                if (!enabled) return;
                try {
                    var ctx = getContext();
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();

                    osc.type = type || 'sine';
                    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
                    osc.connect(gain);
                    gain.connect(ctx.destination);

                    var vol = volume * (volumeMod || 1);
                    gain.gain.setValueAtTime(vol, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

                    osc.start(ctx.currentTime);
                    osc.stop(ctx.currentTime + duration);
                } catch(e) { console.log('Sound error:', e); }
            }

            function playNoise(duration, volumeMod) {
                if (!enabled) return;
                try {
                    var ctx = getContext();
                    var bufferSize = ctx.sampleRate * duration;
                    var buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                    var data = buffer.getChannelData(0);
                    for (var i = 0; i < bufferSize; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    var noise = ctx.createBufferSource();
                    noise.buffer = buffer;
                    var gain = ctx.createGain();
                    var filter = ctx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 1000;
                    noise.connect(filter);
                    filter.connect(gain);
                    gain.connect(ctx.destination);
                    var vol = volume * (volumeMod || 0.3);
                    gain.gain.setValueAtTime(vol, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
                    noise.start();
                } catch(e) {}
            }

            return {
                // Basic sounds
                click: function() { playTone(800, 'sine', 0.05, 0.5); },
                pop: function() { playTone(600, 'sine', 0.08, 0.6); playTone(900, 'sine', 0.04, 0.3); },
                success: function() {
                    playTone(523, 'sine', 0.1, 0.4);
                    setTimeout(function() { playTone(659, 'sine', 0.1, 0.4); }, 100);
                    setTimeout(function() { playTone(784, 'sine', 0.15, 0.5); }, 200);
                },
                error: function() {
                    playTone(200, 'sawtooth', 0.15, 0.3);
                    setTimeout(function() { playTone(150, 'sawtooth', 0.2, 0.3); }, 100);
                },
                hover: function() { playTone(1200, 'sine', 0.03, 0.2); },
                whoosh: function() {
                    playTone(400, 'sine', 0.15, 0.3);
                    playNoise(0.1, 0.2);
                },
                ding: function() { playTone(1047, 'sine', 0.3, 0.4); },

                // Fun sounds
                boing: function() {
                    var ctx = getContext();
                    if (!enabled || !ctx) return;
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(150, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
                    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.3);
                },
                zap: function() {
                    playTone(2000, 'sawtooth', 0.05, 0.3);
                    playTone(100, 'sawtooth', 0.1, 0.2);
                },
                magic: function() {
                    [523, 659, 784, 1047, 1319].forEach(function(f, i) {
                        setTimeout(function() { playTone(f, 'sine', 0.15, 0.3); }, i * 50);
                    });
                },
                coin: function() {
                    playTone(988, 'square', 0.05, 0.3);
                    setTimeout(function() { playTone(1319, 'square', 0.15, 0.3); }, 50);
                },
                powerup: function() {
                    [262, 330, 392, 523, 659, 784].forEach(function(f, i) {
                        setTimeout(function() { playTone(f, 'square', 0.08, 0.25); }, i * 60);
                    });
                },
                glitch: function() {
                    for (var i = 0; i < 5; i++) {
                        setTimeout(function() {
                            playTone(Math.random() * 2000 + 100, 'sawtooth', 0.03, 0.2);
                        }, i * 30);
                    }
                },
                laser: function() {
                    var ctx = getContext();
                    if (!enabled || !ctx) return;
                    var osc = ctx.createOscillator();
                    var gain = ctx.createGain();
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(1500, ctx.currentTime);
                    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
                    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
                    osc.start();
                    osc.stop(ctx.currentTime + 0.2);
                },
                explosion: function() {
                    playNoise(0.3, 0.5);
                    playTone(80, 'sine', 0.3, 0.4);
                },
                eldritch: function() {
                    playTone(50, 'sine', 0.5, 0.4);
                    playTone(53, 'sine', 0.5, 0.3);
                    setTimeout(function() { playTone(47, 'sawtooth', 0.3, 0.2); }, 200);
                },

                // Settings
                setEnabled: function(val) { enabled = val; safeSet(localStorage, 'cflSoundsEnabled', val); },
                setVolume: function(val) { volume = val; safeSet(localStorage, 'cflSoundsVolume', val); },
                isEnabled: function() { return enabled; },
                getVolume: function() { return volume; }
            };
        })();

        // =====================================================================
        // PRIVACY DISCLAIMER SYSTEM
        // =====================================================================
        //
        // PURPOSE: Shows a privacy disclaimer on first visit and provides
        //          data management controls (export/clear)
        //
        // STORAGE:
        //   localStorage.cflPrivacyAccepted - 'true' if dismissed
        //
        // SEE: _includes/privacy-disclaimer.html for HTML structure
        // =====================================================================
        CFL.privacy = (function() {
            var STORAGE_KEY = 'cflPrivacyAccepted';

            function isAccepted() {
                return safeGet(localStorage, STORAGE_KEY, 'false') === 'true';
            }

            function accept() {
                safeSet(localStorage, STORAGE_KEY, 'true');
            }

            function showDisclaimer() {
                var disclaimer = document.getElementById('cfl-privacy-disclaimer');
                if (disclaimer) {
                    disclaimer.removeAttribute('hidden');
                }
            }

            function hideDisclaimer() {
                var disclaimer = document.getElementById('cfl-privacy-disclaimer');
                if (disclaimer) {
                    disclaimer.setAttribute('hidden', '');
                }
            }

            function showDataModal() {
                var modal = document.getElementById('cfl-data-modal');
                if (modal) {
                    modal.removeAttribute('hidden');
                    updateDataStats();
                }
            }

            function hideDataModal() {
                var modal = document.getElementById('cfl-data-modal');
                if (modal) {
                    modal.setAttribute('hidden', '');
                }
            }

            function showConfirmModal() {
                var modal = document.getElementById('cfl-confirm-modal');
                if (modal) {
                    modal.removeAttribute('hidden');
                }
            }

            function hideConfirmModal() {
                var modal = document.getElementById('cfl-confirm-modal');
                if (modal) {
                    modal.setAttribute('hidden', '');
                }
            }

            function updateDataStats() {
                var statsContainer = document.querySelector('#cfl-data-stats .cfl-data-modal__stats');
                if (!statsContainer) return;

                var achievements = safeParse(safeGet(localStorage, 'cflAchievements', '{}'), {});
                var stats = safeParse(safeGet(localStorage, 'cflStats', '{}'), {});
                var unlockedCount = Object.keys(achievements).length;
                var clickCount = stats.clicks || 0;
                var pageCount = (stats.pages || []).length;
                var xp = CFL.achievements ? CFL.achievements.getTotalXP() : 0;

                statsContainer.innerHTML = [
                    '<div class="cfl-data-modal__stat">',
                    '  <div class="cfl-data-modal__stat-value">' + unlockedCount + '</div>',
                    '  <div class="cfl-data-modal__stat-label">Achievements</div>',
                    '</div>',
                    '<div class="cfl-data-modal__stat">',
                    '  <div class="cfl-data-modal__stat-value">' + xp + '</div>',
                    '  <div class="cfl-data-modal__stat-label">Total XP</div>',
                    '</div>',
                    '<div class="cfl-data-modal__stat">',
                    '  <div class="cfl-data-modal__stat-value">' + clickCount + '</div>',
                    '  <div class="cfl-data-modal__stat-label">Clicks</div>',
                    '</div>',
                    '<div class="cfl-data-modal__stat">',
                    '  <div class="cfl-data-modal__stat-value">' + pageCount + '</div>',
                    '  <div class="cfl-data-modal__stat-label">Pages Visited</div>',
                    '</div>'
                ].join('');
            }

            function exportData() {
                var data = {
                    exportDate: new Date().toISOString(),
                    achievements: safeParse(safeGet(localStorage, 'cflAchievements', '{}'), {}),
                    stats: safeParse(safeGet(localStorage, 'cflStats', '{}'), {}),
                    preferences: {
                        font: safeGet(localStorage, 'cflSettingsSite', null),
                        sounds: safeGet(localStorage, 'cflSoundsEnabled', 'true'),
                        soundVolume: safeGet(localStorage, 'cflSoundsVolume', '0.3')
                    },
                    easterEggs: safeParse(safeGet(localStorage, 'cflFoundEggs', '[]'), []),
                    voidCorruption: safeGet(localStorage, 'voidCorruption', '0')
                };

                var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                var url = URL.createObjectURL(blob);
                var a = document.createElement('a');
                a.href = url;
                a.download = 'cfl-wiki-data-' + new Date().toISOString().split('T')[0] + '.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                if (CFL.sounds) CFL.sounds.success();
                if (CFL.toast) {
                    CFL.toast({
                        icon: '📥',
                        title: 'Data Exported!',
                        message: 'Your progress has been saved to a file.',
                        variant: 'success',
                        iconAnim: 'bounce'
                    });
                }
            }

            function clearAllData() {
                // List of all CFL localStorage keys to clear
                var keysToRemove = [
                    'cflAchievements',
                    'cflStats',
                    'cflPrivacyAccepted',
                    'cflSettingsSite',
                    'cflSettingsScope',
                    'cflSettingsDebug',
                    'cflSettingsHidden',
                    'cflSoundsEnabled',
                    'cflSoundsVolume',
                    'cflFoundEggs',
                    'voidCorruption'
                ];

                keysToRemove.forEach(function(key) {
                    safeRemove(localStorage, key);
                });

                // Also clear any page-specific settings
                Object.keys(localStorage).forEach(function(key) {
                    if (key.startsWith('cflSettingsPage:')) {
                        safeRemove(localStorage, key);
                    }
                });

                if (CFL.sounds) CFL.sounds.whoosh();
                if (CFL.toast) {
                    CFL.toast({
                        icon: '🗑️',
                        title: 'Data Cleared',
                        message: 'All progress has been reset. Refreshing...',
                        variant: 'info',
                        iconAnim: 'shake'
                    });
                }

                // Reload page after a brief delay
                setTimeout(function() {
                    window.location.reload();
                }, 1500);
            }

            function init() {
                // Show disclaimer if not yet accepted
                if (!isAccepted()) {
                    // Small delay to let page render first
                    setTimeout(showDisclaimer, 1000);
                }

                // Accept button
                var acceptBtn = document.getElementById('cfl-privacy-accept');
                if (acceptBtn) {
                    acceptBtn.addEventListener('click', function() {
                        accept();
                        hideDisclaimer();
                        if (CFL.sounds) CFL.sounds.success();
                    });
                }

                // Close button (also accepts)
                var closeBtn = document.getElementById('cfl-privacy-close');
                if (closeBtn) {
                    closeBtn.addEventListener('click', function() {
                        accept();
                        hideDisclaimer();
                    });
                }

                // Manage data button
                var manageBtn = document.getElementById('cfl-privacy-manage');
                if (manageBtn) {
                    manageBtn.addEventListener('click', function() {
                        accept();
                        hideDisclaimer();
                        showDataModal();
                    });
                }

                // Data modal close handlers
                var dataModal = document.getElementById('cfl-data-modal');
                if (dataModal) {
                    dataModal.querySelectorAll('[data-close]').forEach(function(el) {
                        el.addEventListener('click', hideDataModal);
                    });
                }

                // Export button
                var exportBtn = document.getElementById('cfl-data-export');
                if (exportBtn) {
                    exportBtn.addEventListener('click', exportData);
                }

                // Clear button (shows confirmation)
                var clearBtn = document.getElementById('cfl-data-clear');
                if (clearBtn) {
                    clearBtn.addEventListener('click', showConfirmModal);
                }

                // Confirm modal handlers
                var confirmModal = document.getElementById('cfl-confirm-modal');
                if (confirmModal) {
                    // Close on backdrop click
                    confirmModal.addEventListener('click', function(e) {
                        if (e.target === confirmModal || e.target.hasAttribute('data-close') || e.target.closest('[data-close]')) {
                            hideConfirmModal();
                        }
                    });
                }

                // Confirm clear button
                var confirmClearBtn = document.getElementById('cfl-confirm-clear');
                if (confirmClearBtn) {
                    confirmClearBtn.addEventListener('click', function() {
                        hideConfirmModal();
                        hideDataModal();
                        clearAllData();
                    });
                }

                // Close modals on Escape key
                document.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        var confirmModal = document.getElementById('cfl-confirm-modal');
                        var dataModal = document.getElementById('cfl-data-modal');
                        if (confirmModal && !confirmModal.hasAttribute('hidden')) {
                            hideConfirmModal();
                        } else if (dataModal && !dataModal.hasAttribute('hidden')) {
                            hideDataModal();
                        }
                    }
                });
            }

            // Initialize on DOM ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }

            return {
                isAccepted: isAccepted,
                accept: accept,
                showDataModal: showDataModal,
                hideDataModal: hideDataModal,
                showConfirmModal: showConfirmModal,
                hideConfirmModal: hideConfirmModal,
                exportData: exportData,
                clearAllData: clearAllData
            };
        })();

        // =====================================================================
        // =====================================================================
        // WIKI SEARCH & FILTER SYSTEM
        // =====================================================================
        //
        // PURPOSE: Client-side search and category filtering for wiki pages
        //
        // ELEMENTS:
        //   - Search input (#wiki-search-input)
        //   - Category pills (.category-pill)
        //   - Card grid (#wiki-card-grid)
        //   - Results count (#wiki-results-count)
        //   - No results message (#wiki-no-results)
        //
        // =====================================================================
        (function initWikiSearch() {
            var searchInput = document.getElementById('wiki-search-input');
            var searchClear = document.getElementById('wiki-search-clear');
            var cardGrid = document.getElementById('wiki-card-grid');
            var resultsCount = document.getElementById('wiki-results-count');
            var noResults = document.getElementById('wiki-no-results');
            var resetBtn = document.getElementById('wiki-reset-filters');
            var categoryPills = document.querySelectorAll('.category-pill');

            // Exit if not on home page with wiki cards
            if (!cardGrid || !searchInput) return;

            var cards = cardGrid.querySelectorAll('.wiki-card');
            var currentCategory = 'all';
            var currentSearch = '';

            // Filter cards based on search and category
            function filterCards() {
                var visibleCount = 0;
                var searchLower = currentSearch.toLowerCase().trim();

                cards.forEach(function(card) {
                    var title = card.getAttribute('data-title') || '';
                    var excerpt = card.getAttribute('data-excerpt') || '';
                    var category = card.getAttribute('data-category') || '';

                    var matchesSearch = !searchLower ||
                        title.indexOf(searchLower) !== -1 ||
                        excerpt.indexOf(searchLower) !== -1;

                    var matchesCategory = currentCategory === 'all' ||
                        category === currentCategory;

                    var isVisible = matchesSearch && matchesCategory;

                    if (isVisible) {
                        card.classList.remove('wiki-card--hidden');
                        card.style.display = '';
                        visibleCount++;
                    } else {
                        card.classList.add('wiki-card--hidden');
                        card.style.display = 'none';
                    }
                });

                // Update results count
                if (resultsCount) {
                    if (currentSearch || currentCategory !== 'all') {
                        resultsCount.textContent = 'Showing ' + visibleCount + ' of ' + cards.length + ' pages';
                    } else {
                        resultsCount.textContent = 'Showing all ' + cards.length + ' pages';
                    }
                }

                // Show/hide no results message
                if (noResults) {
                    if (visibleCount === 0) {
                        noResults.style.display = 'block';
                        cardGrid.style.display = 'none';
                    } else {
                        noResults.style.display = 'none';
                        cardGrid.style.display = '';
                    }
                }

                // Update clear button visibility
                if (searchClear) {
                    searchClear.style.opacity = currentSearch ? '1' : '0';
                    searchClear.style.pointerEvents = currentSearch ? 'auto' : 'none';
                }
            }

            // Search input handler with debounce
            var searchTimeout;
            searchInput.addEventListener('input', function(e) {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(function() {
                    currentSearch = e.target.value;
                    filterCards();
                }, 150);
            });

            // Clear search button
            if (searchClear) {
                searchClear.addEventListener('click', function() {
                    searchInput.value = '';
                    currentSearch = '';
                    filterCards();
                    searchInput.focus();
                    if (CFL.sounds) CFL.sounds.click();
                });
            }

            // Category pill click handlers
            categoryPills.forEach(function(pill) {
                pill.addEventListener('click', function() {
                    // Update active state
                    categoryPills.forEach(function(p) {
                        p.classList.remove('category-pill--active');
                    });
                    pill.classList.add('category-pill--active');

                    // Update filter
                    currentCategory = pill.getAttribute('data-category');
                    filterCards();

                    if (CFL.sounds) CFL.sounds.pop();
                });
            });

            // Reset filters button
            if (resetBtn) {
                resetBtn.addEventListener('click', function() {
                    searchInput.value = '';
                    currentSearch = '';
                    currentCategory = 'all';

                    // Reset active pill
                    categoryPills.forEach(function(p) {
                        p.classList.remove('category-pill--active');
                        if (p.getAttribute('data-category') === 'all') {
                            p.classList.add('category-pill--active');
                        }
                    });

                    filterCards();
                    if (CFL.sounds) CFL.sounds.success();
                });
            }

            // Keyboard shortcut: "/" to focus search
            document.addEventListener('keydown', function(e) {
                if (e.key === '/' && document.activeElement !== searchInput) {
                    // Don't trigger if typing in an input
                    if (document.activeElement.tagName === 'INPUT' ||
                        document.activeElement.tagName === 'TEXTAREA') {
                        return;
                    }
                    e.preventDefault();
                    searchInput.focus();
                }
                // ESC to clear and blur search
                if (e.key === 'Escape' && document.activeElement === searchInput) {
                    searchInput.value = '';
                    currentSearch = '';
                    filterCards();
                    searchInput.blur();
                }
            });

            // Initial state
            filterCards();
        })();

        // =====================================================================
            // Requirements expand/collapse on mobile
            var requirements = list.querySelectorAll('.opportunity-card__requirements');
            requirements.forEach(function(req) {
                var items = req.querySelectorAll('li');
                if (items.length > 2 && window.innerWidth < 720) {
                    req.setAttribute('data-has-more', 'true');
                    req.setAttribute('data-more-text', '+ ' + (items.length - 2) + ' more');

                    req.addEventListener('click', function() {
                        req.classList.toggle('is-expanded');
                        if (req.classList.contains('is-expanded')) {
                            req.setAttribute('data-more-text', 'Show less');
                        } else {
                            req.setAttribute('data-more-text', '+ ' + (items.length - 2) + ' more');
                        }
                    });
                }
            });

            filterItems();
        })();

        // Floating settings widget (font switcher + scope)
        (function initSettingsWidget() {
            var settings = document.getElementById('cfl-settings');
            if (!settings) return;

            var fab = settings.querySelector('.cfl-settings__fab');
            var orbitButtons = settings.querySelectorAll('.cfl-settings__orbit-btn');
            var panels = settings.querySelectorAll('.cfl-settings__panel');
            var fontSelect = document.getElementById('cfl-font-select');
            var scopeToggle = document.getElementById('cfl-settings-scope');
            var debugToggle = document.getElementById('cfl-settings-debug');
            var resetButton = settings.querySelector('[data-action="reset-scope"]');
            var scrim = settings.querySelector('[data-scrim]');
            var swatches = settings.querySelectorAll('.cfl-settings__swatch');
            var dismissBtn = document.getElementById('cfl-settings-dismiss');
            var navSettingsBtn = document.getElementById('cfl-nav-settings-btn');

            // Load settings from central config (_data/settings.yml)
            var config = window.CFL_CONFIG || {};
            var STATE_KEYS = config.state_keys || {
                scope: 'cflSettingsScope',
                site: 'cflSettingsSite',
                pagePrefix: 'cflSettingsPage:',
                hidden: 'cflSettingsHidden'
            };

            // Build fonts object from config
            var fonts = {};
            if (config.fonts) {
                Object.keys(config.fonts).forEach(function(key) {
                    fonts[key] = {
                        heading: config.fonts[key].heading,
                        body: config.fonts[key].body,
                        ui: config.fonts[key].ui
                    };
                });
            } else {
                // Fallback if config not loaded
                fonts = {
                    default: { heading: "'Georgia', 'Times New Roman', serif", body: "'Georgia', 'Times New Roman', serif", ui: "'Inter', system-ui, sans-serif" }
                };
            }

            // Build themes object from config
            var themes = {};
            if (config.themes) {
                Object.keys(config.themes).forEach(function(key) {
                    var theme = config.themes[key];
                    themes[key] = key === 'default' ? {} : {
                        '--accent': theme.accent,
                        '--accent-hover': theme.accent_hover,
                        '--accent-secondary': theme.accent_secondary,
                        '--accent-secondary-hover': theme.accent_secondary_hover
                    };
                });
            } else {
                // Fallback if config not loaded
                themes = { default: {} };
            }

            // Initialize state from config defaults
            var config = window.CFL_CONFIG || {};
            var defaults = config.defaults || {};
            var state = {
                scope: defaults.settings_scope || 'site',
                font: defaults.font || 'default',
                theme: defaults.theme || 'default',
                debug: defaults.settings_debug !== false,
                openPanel: null
            };

            function logger() {
                if (!state.debug) return;
                var args = Array.prototype.slice.call(arguments);
                args.unshift('[CFL settings]');
                console.info.apply(console, args);
            }

            function storageForScope(scope) {
                return scope === 'site' ? localStorage : sessionStorage;
            }

            function scopeKey(scope) {
                return scope === 'site' ? STATE_KEYS.site : STATE_KEYS.pagePrefix + window.location.pathname;
            }

            function readScopePreference() {
                var savedScope = safeGet(localStorage, STATE_KEYS.scope, null);
                if (savedScope === 'page' || savedScope === 'site') {
                    state.scope = savedScope;
                }
                if (scopeToggle) {
                    scopeToggle.checked = state.scope === 'site';
                }
            }

            function readDebugPreference() {
                var config = window.CFL_CONFIG || {};
                var debugKey = (config.storage_keys && config.storage_keys.settings_debug) || 'cflSettingsDebug';
                var defaultDebug = (config.defaults && config.defaults.settings_debug !== false) || true;
                var saved = safeGet(localStorage, debugKey, null);
                state.debug = saved === null ? defaultDebug : saved !== 'false';
                if (debugToggle) debugToggle.checked = state.debug;
            }

            function readFontPreference() {
                var config = window.CFL_CONFIG || {};
                var defaults = config.defaults || {};
                var defaultFont = defaults.font || 'default';
                var defaultTheme = defaults.theme || 'default';
                var storage = storageForScope(state.scope);
                var key = scopeKey(state.scope);
                var stored = safeParse(safeGet(storage, key, null), null);
                state.font = stored && stored.font && fonts[stored.font] ? stored.font : defaultFont;
                state.theme = stored && stored.theme && themes[stored.theme] ? stored.theme : defaultTheme;
                if (fontSelect) fontSelect.value = state.font;
            }

            function applyFont() {
                // Load font if not already loaded (lazy loading)
                if (window.CFL && window.CFL.fonts && window.CFL.fonts.loadFont) {
                    window.CFL.fonts.loadFont(state.font);
                }

                var chosen = fonts[state.font] || fonts.default;
                var root = document.documentElement;
                root.style.setProperty('--font-heading', chosen.heading);
                root.style.setProperty('--font-body', chosen.body);
                root.style.setProperty('--font-ui', chosen.ui);
                logger('Applied font', state.font, 'scope', state.scope);
            }

            function updateActiveSwatch() {
                swatches.forEach(function(swatch) {
                    var t = swatch.getAttribute('data-theme');
                    swatch.classList.toggle('is-active', t === state.theme);
                });
            }

            function applyTheme() {
                var root = document.documentElement;
                // Reset to defaults first
                root.style.removeProperty('--accent');
                root.style.removeProperty('--accent-hover');
                root.style.removeProperty('--accent-secondary');
                root.style.removeProperty('--accent-secondary-hover');
                var chosen = themes[state.theme] || themes.default;
                Object.keys(chosen).forEach(function(key) {
                    root.style.setProperty(key, chosen[key]);
                });
                updateActiveSwatch();
                logger('Applied theme', state.theme, 'scope', state.scope);
            }

            function persist() {
                var storage = storageForScope(state.scope);
                var key = scopeKey(state.scope);
                safeSet(storage, key, JSON.stringify({ font: state.font, theme: state.theme }));
                safeSet(localStorage, STATE_KEYS.scope, state.scope);
                logger('Persisted settings', { scope: state.scope, font: state.font, theme: state.theme });
            }

            function resetCurrentScope() {
                var storage = storageForScope(state.scope);
                safeRemove(storage, scopeKey(state.scope));
                var config = window.CFL_CONFIG || {};
                var defaults = config.defaults || {};
                state.font = defaults.font || 'default';
                state.theme = defaults.theme || 'default';
                if (fontSelect) fontSelect.value = state.font;
                applyFont();
                applyTheme();
                persist();
                logger('Reset settings for scope', state.scope);
            }

            function dismissSettings() {
                closePanels();
                settings.classList.add('cfl-settings--hidden');
                safeSet(localStorage, STATE_KEYS.hidden, 'true');
                if (navSettingsBtn) {
                    navSettingsBtn.classList.add('cfl-nav-settings--active');
                }
                logger('Settings widget dismissed');
            }

            function showSettings() {
                settings.classList.remove('cfl-settings--hidden');
                safeRemove(localStorage, STATE_KEYS.hidden);
                if (navSettingsBtn) {
                    navSettingsBtn.classList.remove('cfl-nav-settings--active');
                }
                logger('Settings widget shown');
            }

            function checkHiddenState() {
                var isHidden = safeGet(localStorage, STATE_KEYS.hidden, 'false') === 'true';
                if (isHidden) {
                    settings.classList.add('cfl-settings--hidden');
                    if (navSettingsBtn) {
                        navSettingsBtn.classList.add('cfl-nav-settings--active');
                    }
                }
            }

            function openOrbitOnly() {
                state.openPanel = null;
                settings.classList.add('cfl-settings--open');
                fab.setAttribute('aria-expanded', 'true');
                panels.forEach(function(panel) { panel.setAttribute('hidden', ''); });
                settings.removeAttribute('data-open-panel');
                if (scrim) scrim.setAttribute('hidden', '');

                // Show labels briefly so users learn what icons do
                settings.classList.add('cfl-settings--labels-visible');
                setTimeout(function() {
                    settings.classList.remove('cfl-settings--labels-visible');
                }, 2000);
            }

            function openPanel(panelId) {
                state.openPanel = panelId;
                settings.classList.add('cfl-settings--open');
                fab.setAttribute('aria-expanded', 'true');
                panels.forEach(function(panel) {
                    var active = panel.getAttribute('data-panel') === panelId;
                    panel.toggleAttribute('hidden', !active);
                });
                settings.setAttribute('data-open-panel', panelId);
                if (scrim) scrim.removeAttribute('hidden');

                // Lazy load all optional fonts when fonts panel is opened
                // This ensures fonts are available when user browses the dropdown
                if (panelId === 'fonts' && window.CFL && window.CFL.fonts && window.CFL.fonts.loadAllOptionalFonts) {
                    window.CFL.fonts.loadAllOptionalFonts();
                }
            }

            function closePanels() {
                state.openPanel = null;
                settings.classList.remove('cfl-settings--open');
                fab.setAttribute('aria-expanded', 'false');
                panels.forEach(function(panel) {
                    panel.setAttribute('hidden', '');
                });
                settings.removeAttribute('data-open-panel');
                if (scrim) scrim.setAttribute('hidden', '');
            }

            function togglePanels(panelId) {
                if (state.openPanel === panelId) {
                    closePanels();
                } else {
                    openPanel(panelId);
                }
            }

            // Event wiring
            if (fab) {
                fab.addEventListener('click', function() {
                    if (settings.classList.contains('cfl-settings--open') && !state.openPanel) {
                        closePanels();
                    } else if (settings.classList.contains('cfl-settings--open') && state.openPanel) {
                        openOrbitOnly();
                    } else {
                        openOrbitOnly();
                    }
                });
            }

            function positionOrbitButtons() {
                if (!orbitButtons.length) return;
                // Read CSS variable for orbit radius, fallback to 90
                var computedStyle = getComputedStyle(settings);
                var cssRadius = parseInt(computedStyle.getPropertyValue('--orbit-radius')) || 90;
                var radius = cssRadius;
                // Quarter circle from bottom-right: -90° (up) to -180° (left)
                var startDeg = -90;
                var endDeg = -180;
                var steps = orbitButtons.length > 1 ? orbitButtons.length - 1 : 1;
                orbitButtons.forEach(function(btn, index) {
                    var angleDeg = startDeg + ((endDeg - startDeg) * (index / steps));
                    var angleRad = angleDeg * (Math.PI / 180);
                    var tx = Math.cos(angleRad) * radius;
                    var ty = Math.sin(angleRad) * radius;
                    btn.style.setProperty('--tx', tx.toFixed(2) + 'px');
                    btn.style.setProperty('--ty', ty.toFixed(2) + 'px');
                });
            }

            positionOrbitButtons();
            // Reposition on resize to handle responsive breakpoint changes
            window.addEventListener('resize', positionOrbitButtons);

            orbitButtons.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    var panelId = e.currentTarget.getAttribute('data-panel');
                    var action = e.currentTarget.getAttribute('data-action');

                    if (action === 'quick-font') {
                        var quickFont = e.currentTarget.getAttribute('data-font');
                        if (fonts[quickFont]) {
                            state.font = quickFont;
                            if (fontSelect) fontSelect.value = quickFont;
                            applyFont();
                            persist();
                            logger('Quick font applied from orbit', quickFont);
                        }
                        return;
                    }

                    if (panelId) {
                        openPanel(panelId);
                    }
                });
            });

            // Old settings menu items handler removed - now using inline controls
            // that keep the menu open for live preview (see createUnifiedFabBar)

            if (fontSelect) {
                fontSelect.addEventListener('change', function(e) {
                    state.font = e.target.value;
                    applyFont();
                    applyTheme();
                    persist();
                });
            }

            if (scopeToggle) {
                scopeToggle.addEventListener('change', function(e) {
                    state.scope = e.target.checked ? 'site' : 'page';
                    readFontPreference();
                    applyFont();
                    applyTheme();
                    persist();
                });
            }

            if (debugToggle) {
                debugToggle.addEventListener('change', function(e) {
                    state.debug = e.target.checked;
                    var config = window.CFL_CONFIG || {};
                    var debugKey = (config.storage_keys && config.storage_keys.settings_debug) || 'cflSettingsDebug';
                    safeSet(localStorage, debugKey, state.debug ? 'true' : 'false');
                    if (state.debug) {
                        logger('Debug logging enabled');
                    } else {
                        console.info('[CFL settings] Debug logging disabled');
                    }
                });
            }

            if (resetButton) {
                resetButton.addEventListener('click', function() {
                    resetCurrentScope();
                });
            }

            if (scrim) {
                scrim.addEventListener('click', function() {
                    closePanels();
                });
            }

            if (dismissBtn) {
                dismissBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    dismissSettings();
                });
            }

            if (navSettingsBtn) {
                navSettingsBtn.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (settings.classList.contains('cfl-settings--hidden')) {
                        showSettings();
                        // Open the menu after showing
                        setTimeout(function() {
                            openOrbitOnly();
                        }, 100);
                    } else {
                        // Toggle the menu
                        if (settings.classList.contains('cfl-settings--open')) {
                            closePanels();
                        } else {
                            openOrbitOnly();
                        }
                    }
                });
            }

            swatches.forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    var theme = e.currentTarget.getAttribute('data-theme');
                    if (themes[theme]) {
                        state.theme = theme;
                        swatches.forEach(function(s) { s.classList.toggle('is-active', s === btn); });
                        applyTheme();
                        persist();
                        logger('Theme changed', theme);
                    }
                });
            });

            document.addEventListener('click', function(event) {
                // Don't close if click was inside the old settings widget OR the new dropdown menu
                var newSettingsMenu = document.getElementById('cfl-settings-menu');
                if (!settings.contains(event.target) && (!newSettingsMenu || !newSettingsMenu.contains(event.target))) {
                    closePanels();
                }
            });

            document.addEventListener('keyup', function(event) {
                if (event.key === 'Escape') {
                    closePanels();
                }
            });

            window.addEventListener('pagehide', function() {
                safeRemove(sessionStorage, scopeKey('page'));
            });

            // Expose global API for inline settings menu
            window.CFL = window.CFL || {};
            window.CFL.setFont = function(fontKey) {
                if (fonts[fontKey]) {
                    state.font = fontKey;
                    // Sync all font selects
                    if (fontSelect) fontSelect.value = fontKey;
                    var inlineFontSelect = document.getElementById('cfl-inline-font-select');
                    if (inlineFontSelect) inlineFontSelect.value = fontKey;
                    var drawerFontSelect = document.getElementById('cfl-drawer-font-select');
                    if (drawerFontSelect) drawerFontSelect.value = fontKey;
                    applyFont();
                    persist();
                    logger('Font set via API:', fontKey);
                }
            };
            window.CFL.setTheme = function(themeKey) {
                if (themes[themeKey]) {
                    state.theme = themeKey;
                    applyTheme();
                    persist();
                    logger('Theme set via API:', themeKey);
                }
            };
            window.CFL.resetSettings = function() {
                resetCurrentScope();
            };

            // Init
            checkHiddenState();
            readScopePreference();
            readDebugPreference();
            readFontPreference();
            applyFont();
            applyTheme();
            persist();
            logger('Settings widget initialized', state);

            // Sync all font selects with current state
            var inlineFontSelect = document.getElementById('cfl-inline-font-select');
            if (inlineFontSelect) {
                inlineFontSelect.value = state.font;
            }
            var drawerFontSelect = document.getElementById('cfl-drawer-font-select');
            if (drawerFontSelect) {
                drawerFontSelect.value = state.font;
            }
        })();
    });
        // =====================================================================
        // AUTO-ATTACH SOUNDS TO BUTTONS (Simplified)
        // =====================================================================
        (function attachButtonSounds() {
            document.addEventListener('click', function(e) {
                var btn = e.target.closest('.cfl-btn');
                if (!btn || !CFL.sounds || !CFL.sounds.isEnabled()) return;

                // Play appropriate sound based on button class
                var btnClass = btn.className;
                if (btnClass.includes('--rainbow') || btnClass.includes('--holo') || btnClass.includes('--aurora')) {
                    CFL.sounds.magic();
                } else if (btnClass.includes('--bouncy') || btnClass.includes('--rubber')) {
                    CFL.sounds.boing();
                } else if (btnClass.includes('--neon') || btnClass.includes('--electric')) {
                    CFL.sounds.zap();
                } else if (btnClass.includes('--glitch') || btnClass.includes('--vhs') || btnClass.includes('--static')) {
                    CFL.sounds.glitch();
                } else if (btnClass.includes('--3d') || btnClass.includes('--pixel')) {
                    CFL.sounds.coin();
                } else if (btnClass.includes('--eldritch')) {
                    CFL.sounds.eldritch();
                } else if (btnClass.includes('--confetti') || btnClass.includes('--party')) {
                    CFL.sounds.powerup();
                } else if (btnClass.includes('--portal') || btnClass.includes('--spin')) {
                    CFL.sounds.whoosh();
                } else if (btnClass.includes('--fire') || btnClass.includes('--lava')) {
                    CFL.sounds.explosion();
                } else if (btnClass.includes('--danger')) {
                    CFL.sounds.error();
                } else if (btnClass.includes('--success')) {
                    CFL.sounds.success();
                } else {
                    CFL.sounds.click();
                }
            });

            // Button hover sounds (occasional)
            document.addEventListener('mouseover', function(e) {
                var btn = e.target.closest('.cfl-btn');
                if (btn && CFL.sounds && CFL.sounds.isEnabled() && Math.random() > 0.7) {
                    CFL.sounds.hover();
                }
            });
        })();


