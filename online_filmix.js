/**
 * Filmix plugin for Lampa
 * Упрощённая версия для личного использования.
 * Прямые запросы к API Filmix (без CORS-прокси).
 * Локализация: только ru и en.
 */
(function () {
    'use strict';

    // Проверка минимальной версии Lampa
    if (window.online_filmix || Lampa.Manifest.app_digital < 155) return;
    window.online_filmix = true;

    // ============================================================
    //  КОНСТАНТЫ
    // ============================================================
    const API_BASE   = 'https://fxapp.biz/api/v2/';
    const STORAGE    = {
        TOKEN:   'fxapi_token',
        UID:     'fxapi_uid',
        STATUS:  'fxapi_status',
        CHOICE:  'online_choice_fxapi',
        VIEWED:  'online_view',
        LAST:    'online_watched_last',
        PROXY:   'fxapi_proxy'
    };

    const QUALITY = { FREE: 720, PRO: 1080, PRO_PLUS: 2160 };

    // Глобальный объект с лимитом качества
    window.fxapi = window.fxapi || { max_qualitie: QUALITY.FREE, is_max_qualitie: false };

    // ============================================================
    //  УТИЛИТЫ
    // ============================================================
    function getUid() {
        let uid = Lampa.Storage.get(STORAGE.UID, '');
        if (!uid) {
            uid = Lampa.Utils.uid(16);
            Lampa.Storage.set(STORAGE.UID, uid);
        }
        return uid;
    }

    function getToken() {
        return Lampa.Storage.get(STORAGE.TOKEN, '');
    }

    function buildUrl(endpoint, token = getToken()) {
        const uid = getUid();
        const params = [
            'app_lang=ru_RU',
            'user_dev_apk=2.2.13',
            'user_dev_id=' + uid,
            'user_dev_vendor=Xiaomi',
            'user_dev_name=Xiaomi+2210132G',
            'user_dev_os=16',
            'user_dev_token=' + token
        ].join('&');
        return Lampa.Utils.addUrlComponent(API_BASE + endpoint, params);
    }

    function normalize(str) {
        return (str || '').toLowerCase().replace(/[^a-zа-я0-9]/g, '');
    }

    function parseQualities(link, max) {
        if (!link) return [];
        const m = link.match(/\[([\d,\s]*)\]/);
        if (!m) return [];
        return m[1].split(',').map(x => parseInt(x, 10))
            .filter(x => x > 0 && x <= max);
    }

    function maxQuality(arr) {
        return arr && arr.length ? Math.max.apply(null, arr) : 0;
    }

    // ============================================================
    //  ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ
    // ============================================================
    function fetchProfile(token, callback) {
        const req = new Lampa.Reguest();
        req.timeout(8000);
        req.silent(buildUrl('user_profile', token), (res) => {
            if (res && res.user_data) {
                const u = res.user_data;
                if (u.is_pro_plus) window.fxapi.max_qualitie = QUALITY.PRO_PLUS;
                else if (u.is_pro) window.fxapi.max_qualitie = QUALITY.PRO;
                else window.fxapi.max_qualitie = QUALITY.FREE;
                Lampa.Storage.set(STORAGE.STATUS, u);
                renderProfile();
                if (callback) callback(u);
            } else {
                Lampa.Storage.set(STORAGE.STATUS, {});
                window.fxapi.max_qualitie = QUALITY.FREE;
                window.fxapi.is_max_qualitie = false;
                renderProfile();
                if (callback) callback(null);
            }
        }, (e, t) => {
            Lampa.Noty.show(req.error(e, t));
            if (callback) callback(null);
        });
    }

    function clearProfile() {
        Lampa.Storage.set(STORAGE.STATUS, {});
        window.fxapi.max_qualitie = QUALITY.FREE;
        window.fxapi.is_max_qualitie = false;
        renderProfile();
    }

    function renderProfile() {
        const el = $('[data-name="fxapi_profile"]');
        if (!el.length) return;
        const u = Lampa.Storage.get(STORAGE.STATUS, {});
        if (!u || !u.login) {
            el.html('<div class="fxapi-profile fxapi-profile--empty">Устройство не авторизовано</div>');
            return;
        }
        const badge = u.is_pro_plus ? 'PRO+' : (u.is_pro ? 'PRO' : 'Free');
        const avatar = u.avatar
            ? `<img src="${u.avatar}" alt="">`
            : `<div class="fxapi-profile__placeholder">${(u.name || u.login).charAt(0).toUpperCase()}</div>`;
        el.html(`
            <div class="fxapi-profile">
                <div class="fxapi-profile__wrap">
                    <div class="fxapi-profile__avatar">${avatar}</div>
                    <div class="fxapi-profile__body">
                        <div class="fxapi-profile__title">${u.name || u.login}</div>
                        ${u.login && u.login !== u.name ? `<div class="fxapi-profile__login">@${u.login}</div>` : ''}
                        <div class="fxapi-profile__meta">
                            <div class="fxapi-profile__badge">${badge}</div>
                            <div>Макс. качество: <b>${window.fxapi.max_qualitie}p</b></div>
                        </div>
                    </div>
                </div>
            </div>`);
    }

    // ============================================================
    //  SOURCE: поиск и парсинг
    // ============================================================
    class FilmixSource {
        constructor(activity, object) {
            this.activity = activity;
            this.object   = object;
            this.request  = new Lampa.Reguest();
            this.parsed   = null;
            this.byVoice  = {};
            this.choice   = { season: 0, voice: 0, voice_name: '' };
            this.filter   = { season: [], voice: [], voice_info: [] };
            this.similar  = false;
        }

        // --- Поиск ---
        searchByTitle(object, title) {
            const year  = parseInt(((object.movie.year || object.movie.release_date || '0000') + '').slice(0, 4));
            const orig  = object.movie.original_name || object.movie.original_title;
            const url   = Lampa.Utils.addUrlComponent(buildUrl('search'), 'story=' + encodeURIComponent(title));

            this.request.reset();
            this.request.timeout(10000);
            this.request.silent(url, (results) => {
                if (!results || !Array.isArray(results)) return this.activity.doesNotAnswer();

                const filtered = results.filter(r => {
                    r.year = parseInt((r.year || (r.first_air_date || '').split('-')[0]) || 0);
                    return r.year > year - 2 && r.year < year + 2;
                });

                let match = filtered.find(r => r.year === year && normalize(r.title) === normalize(orig));
                if (!match) match = filtered.find(r => normalize(r.title) === normalize(orig));
                if (!match && filtered.length === 1) match = filtered[0];

                if (match) this.find(match.id);
                else if (results.length) {
                    this.similar = true;
                    this.activity.showSimilar(results);
                    this.activity.loading(false);
                } else this.activity.doesNotAnswer();
            }, () => this.activity.doesNotAnswer());
        }

        // --- Получение медиа ---
        find(id) {
            const token = getToken();
            if (!window.fxapi.is_max_qualitie && token) {
                window.fxapi.is_max_qualitie = true;
                this.request.reset();
                this.request.timeout(10000);
                this.request.silent(buildUrl('user_profile', token), (res) => {
                    if (res && res.user_data) {
                        if (res.user_data.is_pro)      window.fxapi.max_qualitie = QUALITY.PRO;
                        if (res.user_data.is_pro_plus) window.fxapi.max_qualitie = QUALITY.PRO_PLUS;
                    }
                    this._loadMedia(id);
                }, () => this._loadMedia(id));
            } else this._loadMedia(id);
        }

        _loadMedia(id) {
            const endpoint = this.object.movie.name ? 'serial/' + id : 'movie/' + id;
            this.request.reset();
            this.request.timeout(10000);
            this.request.silent(buildUrl(endpoint), (data) => {
                data = this._normalizeData(data);
                if (data && this._hasStreams(data)) {
                    this._parse(data);
                    this.activity.loading(false);
                } else if (data && data.id) {
                    this.activity.empty(Lampa.Lang.translate('online_nostreams'));
                } else this.activity.doesNotAnswer();
            }, () => this.activity.doesNotAnswer());
        }

        _normalizeData(data) {
            if (!data || !data.player_links) return data;
            const pl = data.player_links;
            if (Array.isArray(pl.playlist) && !Object.keys(pl.playlist).length) pl.playlist = null;
            return data;
        }

        _hasStreams(data) {
            const pl = data && data.player_links;
            if (!pl) return false;
            if (pl.playlist && pl.playlist.length) return true;
            if (typeof pl.playlist === 'object') return true;
            return false;
        }

        // --- Парсинг плейлиста ---
        _parse(data) {
            this.parsed = data;
            this.byVoice = {};
            const pl = data.player_links;

            if (typeof pl.playlist === 'object' && !Array.isArray(pl.playlist)) {
                let sIdx = 0;
                for (const sKey in pl.playlist) {
                    const season = pl.playlist[sKey];
                    ++sIdx;
                    const seasonNum = parseInt(sKey === '-1' ? '1' : sKey, 10);
                    let vIdx = 0;
                    for (const voiceName in season) {
                        const episodes = this._toObject(season[voiceName]);
                        ++vIdx;
                        const list = [];
                        for (const epKey in episodes) {
                            const ep = episodes[epKey];
                            if (!ep || !ep.link) continue;
                            const qualities = (ep.link.match(/\[([\d,\s]*)\]/) || ['', ''])[1]
                                .split(',').map(x => parseInt(x, 10))
                                .filter(x => x > 0 && x <= window.fxapi.max_qualitie);
                            if (!qualities.length) continue;

                            const maxQ = maxQuality(qualities);
                            const link = ep.link.replace('%s.mp4', maxQ + '.mp4');
                            const tail = link.slice(0 - link.length + link.lastIndexOf('/') + 1);
                            const m = tail.match(/s(\d+)e(\d+?)_\d+\.mp4/i);
                            let sNum = seasonNum, eNum = parseInt(epKey, 10);
                            if (m) { sNum = parseInt(m[1], 10); eNum = parseInt(m[2], 10); }
                            else if (isNaN(eNum)) continue;

                            list.push({
                                id: sNum + '_' + eNum,
                                comment: eNum + ' ' + Lampa.Lang.translate('torrent_serial_episode') + ' <i>' + voiceName + '</i>',
                                file: link,
                                episode: eNum,
                                season: sNum,
                                quality: maxQ,
                                qualities: qualities,
                                translation: vIdx
                            });
                        }
                        if (!this.byVoice[vIdx]) this.byVoice[vIdx] = { json: [], file: '' };
                        this.byVoice[vIdx].json.push({
                            id: sIdx,
                            comment: sIdx + ' ' + Lampa.Lang.translate('torrent_serial_season'),
                            folder: list,
                            translation: vIdx
                        });
                    }
                }
            } else if (pl.movie && pl.movie.length > 0) {
                let mIdx = 0;
                for (const k in pl.movie) {
                    const m = pl.movie[k];
                    if (typeof m.link === 'string' && m.link.indexOf('http://') === 0) continue;
                    ++mIdx;
                    const qualities = parseQualities(m.link, window.fxapi.max_qualitie);
                    const maxQ = maxQuality(qualities);
                    if (!maxQ) continue;
                    const link = m.link.replace(/_\[([\d,\s]*)\]\.mp4/i, '_' + maxQ + '.mp4');
                    this.byVoice[mIdx] = {
                        file: link,
                        translation: m.translation,
                        quality: maxQ,
                        qualities: qualities
                    };
                }
            }

            this._buildFilter();
            const list = this._buildList();
            if (!list.length) { this.activity.doesNotAnswer(); return; }
            this._draw(list);
        }

        _toObject(v) {
            if (!v) return {};
            if (Array.isArray(v)) {
                const o = {};
                for (let i = 0; i < v.length; i++) o[String(i + 1)] = v[i];
                return o;
            }
            return v;
        }

        _buildFilter() {
            this.filter = { season: [], voice: [], voice_info: [] };
            const pl = this.parsed.player_links;

            if (typeof pl.playlist === 'object' && !Array.isArray(pl.playlist)) {
                Object.keys(pl.playlist).sort((a, b) => parseInt(a) - parseInt(b)).forEach(k => {
                    this.filter.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (k === '-1' ? '1' : k));
                });
                const keys = Object.keys(pl.playlist).sort((a, b) => parseInt(a) - parseInt(b));
                const cur  = keys[this.choice.season] || keys[0];
                const data = pl.playlist[cur];
                let i = 0;
                if (data) for (const v in data) {
                    ++i;
                    if (this.filter.voice.indexOf(v) === -1) {
                        this.filter.voice.push(v);
                        this.filter.voice_info.push({ id: i });
                    }
                }
            } else if (this.parsed.player_links && this.parsed.player_links.season) {
                const n = parseInt(this.parsed.player_links.season, 10);
                if (n > 0) for (let i = n; i > 0; i--) {
                    this.filter.season.push(Lampa.Lang.translate('torrent_serial_season') + ' ' + (n - i + 1));
                }
            }

            if (this.choice.voice_name) {
                const idx = this.filter.voice.map(v => v.toLowerCase()).indexOf(this.choice.voice_name.toLowerCase());
                if (idx === -1) this.choice.voice = 0;
                else if (idx !== this.choice.voice) this.choice.voice = idx;
            }
            if (this.choice.voice >= this.filter.voice.length) this.choice.voice = 0;
            if (this.filter.voice.length) {
                this.choice.voice_name = this.filter.voice[this.choice.voice] || '';
            }
            this.activity.filter(this.filter, this.choice);
        }

        _buildList() {
            const list = [];
            const pl = this.parsed.player_links;

            if (typeof pl.playlist === 'object' && !Array.isArray(pl.playlist)) {
                for (const k in this.byVoice) {
                    const voice = this.byVoice[k];
                    for (const j in voice.json) {
                        const season = voice.json[j];
                        if (season.id === this.choice.season + 1) {
                            season.folder.forEach(ep => {
                                if (ep.translation === this.filter.voice_info[this.choice.voice].id) {
                                    list.push({
                                        episode: parseInt(ep.episode),
                                        season: ep.season,
                                        title: Lampa.Lang.translate('torrent_serial_episode') + ' ' + ep.episode +
                                               (ep.title ? ' - ' + ep.title : ''),
                                        quality: ep.quality + 'p ',
                                        translation: ep.translation,
                                        voice_name: this.filter.voice[this.choice.voice],
                                        info: this.filter.voice_info[this.choice.voice]
                                    });
                                }
                            });
                        }
                    }
                }
            } else if (Object.keys(pl.movie).length) {
                for (const k in this.byVoice) {
                    const m = this.byVoice[k];
                    list.push({
                        title: m.translation,
                        quality: m.quality + 'p ',
                        qualitys: m.qualities,
                        translation: k,
                        voice_name: m.translation
                    });
                }
            }
            return list;
        }

        getFile(item, quality) {
            const voice = this.byVoice[item.translation];
            const id = item.season + '_' + item.episode;
            let file = '';

            if (voice) {
                if (item.season) {
                    for (const j in voice.json) {
                        const s = voice.json[j];
                        if (s.folder) {
                            for (const e in s.folder) {
                                if (s.folder[e].id === id) { file = s.folder[e].file; break; }
                            }
                        } else if (s.id === id) { file = s.file; break; }
                    }
                } else file = voice.file;
            }

            quality = parseInt(quality);
            let qualities = {};
            if (file) {
                const base = file.slice(0, file.indexOf('_')) + '_';
                const qs   = file.split('?');
                const tail = qs.length > 1 ? '?' + qs.slice(1).join('?') : '';
                if (file.split('_').pop().replace('.mp4', '') !== String(quality)) {
                    file = base + quality + '.mp4' + tail;
                }
                [2160, 1440, 1080, 720, 480, 360].filter(q => q !== quality).forEach(q => {
                    qualities[q + 'p'] = base + q + '.mp4' + tail;
                });
                const def = Lampa.Storage.get('video_quality_default', '720') + 'p';
                if (qualities[def]) file = qualities[def];
            }
            return { file, quality: qualities };
        }

        _draw(list) {
            this.activity.reset();
            this.activity.draw(list, {
                similars: this.similar,
                onEnter: (item, el) => {
                    const f = this.getFile(item, item.quality);
                    if (f.file) {
                        const playlist = [];
                        if (item.season) list.forEach(e => playlist.push(this._toPlayable(e)));
                        else playlist.push(this._toPlayable(item));
                        if (playlist.length > 1) this._toPlayable(item).playlist = playlist;
                        Lampa.Player.play(this._toPlayable(item));
                        Lampa.Player.playlist(playlist);
                        item.mark();
                    } else Lampa.Noty.show(Lampa.Lang.translate('online_nolink'));
                },
                onContextMenu: (item, el, hashes, cb) => cb(this.getFile(item, item.quality))
            });
        }

        _toPlayable(item) {
            const f = this.getFile(item, item.quality);
            return {
                title: item.title,
                url: f.file,
                quality: f.quality,
                timeline: item.timeline,
                callback: item.mark
            };
        }

        extendChoice(c) { Lampa.Arrays.extend(this.choice, c, true); }
        reset() {
            this.activity.reset();
            this.choice = { season: 0, voice: 0, voice_name: '' };
            this.byVoice = {};
            this._buildFilter();
            this._draw(this._buildList());
            this.activity.saveChoice(this.choice);
        }
        destroy() { this.request.destroy(); this.parsed = null; }
    }

    // ============================================================
    //  ACTIVITY: UI и контроллер
    // ============================================================
    class FilmixActivity {
        constructor(object) {
            this.object   = object;
            this.request  = new Lampa.Reguest();
            this.background = new Lampa.Background({ mask: true, over: true });
            this.explorer = new Lampa.Explorer(object);
            this.filter   = new Lampa.Filter(object);
            this.sources  = { fxapi: FilmixSource };
            this.source   = null;
            this.sourceName = 'fxapi';
            this.active   = null;
            this.images   = [];
            this.choiceId = null;
            this.timer    = null;
            this.started  = false;
            this.extended = false;
            this.labels   = {
                season: Lampa.Lang.translate('torrent_serial_season'),
                voice:  Lampa.Lang.translate('torrent_parser_voice'),
                source: Lampa.Lang.translate('settings_rest_source')
            };
        }

        initialize() {
            this.source = this.createSource();
            this.filter.onSearch = (s) => Lampa.Activity.push({ search: s, clarification: true });
            this.filter.onBack   = () => this.start();
            this.filter.render().find('.selector').on('hover:enter', () => clearInterval(this.timer));
            this.filter.onSelect = (type, data, word) => {
                if (type === 'filter') {
                    if (data.reset) { if (this.extended) this.source.reset(); else this.start(); }
                    else this.source.filter(type, data, word);
                } else if (type === 'balance') Lampa.Select.close();
            };
            if (this.filter.onReady) this.filter.onReady();
            this.filter.render().find('.filter--sort').remove();
            this.explorer.appendFiles(this.background.render());
            this.explorer.append(this.filter.render());
            this.background.body().addClass('cardImgBackgroundBlur');
            this.background.minus(this.explorer.render().find('.explorer__files-head'));
            this.search();
        }

        createSource() { return new this.sources[this.sourceName](this, this.object); }
        render()       { return this.explorer.render(); }
        search()       { this.activity.loader(true); this.find(); }

        find() {
            if (this.source.searchByTitle) {
                this.getChoice();
                this.source.searchByTitle(this.object,
                    this.object.search ||
                    this.object.movie.original_name ||
                    this.object.movie.original_title ||
                    this.object.movie.title ||
                    this.object.movie.name);
            }
        }

        getChoice(name) {
            const store = Lampa.Storage.cache(STORAGE.CHOICE + (name || this.sourceName), 3000, {});
            const id    = this.choiceId || this.object.movie.id;
            const data  = store[id] || {};
            return Lampa.Arrays.extend(data, {
                season: 0, voice: 0, voice_name: '', voice_id: 0,
                episodes_view: {}, movie_view: ''
            });
        }
        extendChoice() { this.extended = true; this.source.extendChoice(this.getChoice()); }
        saveChoice(c, name) {
            const store = Lampa.Storage.cache(STORAGE.CHOICE + (name || this.sourceName), 3000, {});
            store[this.choiceId || this.object.movie.id] = c;
            Lampa.Storage.set(STORAGE.CHOICE + (name || this.sourceName), store);
        }

        showSimilar(results) {
            results.forEach(r => {
                const year = ((r.release_date || r.year || '') + '').slice(0, 4);
                const info = [];
                if (r.rating && r.rating !== 'null' && r.filmId) info.push(Lampa.Template.get('online_prestige_rate', { rate: r.rating }, true));
                if (year) info.push(year);
                if (r.countries && r.countries.length) info.push((r.filmId ? r.countries.map(c => c.country) : r.countries).join(', '));
                if (r.categories && r.categories.length) info.push(r.categories.slice(0, 4).join(', '));

                const title = r.title || r.ru_title || r.en_title || r.alt_name || r.name;
                const orig  = r.orig_title || r.alt_name || '';
                r.title = title + (orig && orig !== title ? ' - ' + orig : '');
                r.time  = r.filmLength || '';
                r.info  = info.join('<span class="online-prestige-split">●</span>');

                const card = Lampa.Template.get('online_prestige_folder', r);
                card.on('hover:enter', () => {
                    this.activity.loader(true);
                    this.reset();
                    this.object.year = year;
                    this.choiceId = r.id;
                    this.getChoice();
                    this.source.search ? this.source.search(this.object, [r]) : this.doesNotAnswer();
                }).on('hover:focus', (e) => {
                    this.active = e.target;
                    this.background.update($(e.target), true);
                });
                this.background.append(card);
            });
        }

        clearImages() {
            this.images.forEach(i => { i.onerror = () => {}; i.onload = () => {}; i.src = ''; });
            this.images = [];
        }
        reset() {
            this.active = false;
            clearInterval(this.timer);
            this.request.destroy();
            this.clearImages();
            this.background.render().find('.online-prestige').empty();
            this.background.destroy();
        }
        loading(state) {
            if (state) this.explorer.loader(true);
            else { this.explorer.loader(false); this.explorer.draw(); }
        }
        filter(f, c) {
            const items = [];
            const build = (key, title) => {
                const list  = f[key];
                const items = [];
                const sel   = this.getChoice()[key];
                list.forEach((t, i) => items.push({ title: t, selected: sel === i, index: i }));
                this.items.push({ title, subtitle: list[sel], items, stype: key });
            };
            this.items = [];
            this.items.push({ title: Lampa.Lang.translate('title_filter'), reset: true });
            this.saveChoice(c);
            if (f.voice  && f.voice.length)  build('voice',  Lampa.Lang.translate('torrent_parser_voice'));
            if (f.season && f.season.length) build('season', Lampa.Lang.translate('torrent_serial_season'));
            this.filter.set('filter', this.items);
            this._updateChosen(f);
        }
        closeFilter() { if ($('body').hasClass('selectbox--open')) Lampa.Select.close(); }
        _updateChosen(f) {
            const c = this.getChoice();
            const lines = [];
            for (const k in c) {
                if (f[k] && f[k].length) {
                    if (k === 'voice') lines.push(this.labels[k] + ': ' + f[k][c[k]]);
                    else if (k !== 'source' && f.season.length >= 1) lines.push(this.labels.season + ': ' + f[k][c[k]]);
                }
            }
            this.filter.chosen('filter', lines);
            this.filter.chosen('balance', [this.sourceName]);
        }

        getEpisodes(season, callback) {
            const episodes = [];
            if (typeof this.object.movie.id === 'number' && this.object.movie.name) {
                const url = 'https://api.themoviedb.org/3/tv/' + this.object.movie.id +
                            '/season/' + season + '?api_key=' + Lampa.TMDB.key() +
                            '&language=' + Lampa.Storage.get('language', 'ru');
                const tmdb = Lampa.TMDB.api(url);
                this.request.timeout(4000);
                this.request.native(tmdb, (res) => {
                    callback(res.episodes || []);
                }, () => callback(episodes));
            } else callback(episodes);
        }

        setFocus(item) {
            item.on('hover:focus', (e) => {
                this.active = e.target;
                this.background.update($(e.target), true);
            });
            this.background.append(item);
        }

        setWatched(data) {
            const key = Lampa.Utils.hash(this.object.movie.name ? this.object.movie.original_title : this.object.movie.title);
            const store = Lampa.Storage.cache(STORAGE.LAST, 5000, {});
            if (data) {
                if (!store[key]) store[key] = {};
                Lampa.Arrays.extend(store[key], data, true);
                Lampa.Storage.set(STORAGE.LAST, store);
            } else return store[key];
        }

        draw(items, params = {}) {
            if (!items.length) return this.empty();
            this.getEpisodes(items[0].season, (tmdbEpisodes) => {
                const viewed   = Lampa.Storage.cache(STORAGE.VIEWED, 5000, []);
                const isSerial = !!this.object.movie.name;
                const choice   = this.getChoice();
                const wide     = window.innerWidth > 480;
                let focusElem  = null;
                let viewedElem = null;

                items.forEach((item, idx) => {
                    const tmdb = isSerial && tmdbEpisodes.length && !params.similars
                        ? tmdbEpisodes.find(e => e.episode_number === item.episode) : false;
                    const epNum = item.episode || idx + 1;
                    const lastEp = choice.episodes_view[item.season];

                    Lampa.Arrays.extend(item, {
                        info: '', quality: '',
                        time: Lampa.Utils.secondsToTime((tmdb ? tmdb.runtime : this.object.movie.runtime) * 60, true)
                    });

                    const hashTime   = Lampa.Utils.hash(item.season ? [item.season, item.episode, this.object.movie.original_title].join('') : this.object.movie.title);
                    const hashBehold = Lampa.Utils.hash(item.season ? [item.season, item.episode, this.object.movie.original_title, item.voice_name].join('') : this.object.movie.title + item.voice_name);
                    const hashes     = { hash_timeline: hashTime, hash_behold: hashBehold };
                    const info       = [];

                    if (item.season) {
                        item.translate_episode_end = this.getLastEpisode(items);
                        item.voice_id              = item.voice_name;
                    }
                    item.timeline = Lampa.Timeline.view(hashTime);

                    if (tmdb) {
                        item.title = tmdb.name;
                        if (item.info.length < 30 && tmdb.vote_average) info.push(Lampa.Template.get('online_prestige_rate', { rate: parseFloat(tmdb.vote_average + '').toFixed(1) }, true));
                        if (tmdb.air_date && wide) info.push(Lampa.Utils.parseTime(tmdb.air_date).short);
                    } else if (this.object.movie.release_date && wide) {
                        info.push(Lampa.Utils.parseTime(this.object.movie.release_date).short);
                    }
                    if (!isSerial && this.object.movie.tagline && item.info.length < 30) info.push(this.object.movie.tagline);
                    if (item.info) info.push(item.info);
                    if (info.length) item.info = info.map(i => `<span>${i}</span>`).join('<span class="online-prestige-split">●</span>');

                    const card   = Lampa.Template.get('online_prestige_full', item);
                    const body   = card.find('.online-prestige__body');
                    const imgBox = card.find('.online-prestige__img');

                    if (!isSerial) {
                        if (choice.movie_view === hashBehold) focusElem = card;
                    } else if (typeof lastEp !== 'undefined' && lastEp === epNum) focusElem = card;

                    if (isSerial && !tmdb) {
                        imgBox.html('<div class="online-prestige__episode-number">' + ('0' + (item.episode || idx + 1)).slice(-2) + '</div>');
                        body.find('.online-prestige__title').remove();
                    } else {
                        const img = card.find('img')[0];
                        img.onerror = () => img.src = './img/img_broken.svg';
                        img.onload = () => {
                            imgBox.addClass('online-prestige__img--loaded');
                            body.find('.online-prestige__loader').remove();
                            if (isSerial) imgBox.append('<div class="online-prestige__episode-number">' + ('0' + (item.episode || idx + 1)).slice(-2) + '</div>');
                        };
                        img.src = Lampa.TMDB.image('t/p/w300' + (tmdb ? tmdb.still_path : this.object.movie.backdrop_path));
                        this.images.push(img);
                    }

                    card.find('.online-prestige__timeline').append(Lampa.Timeline.render(item.timeline));
                    if (viewed.indexOf(hashBehold) !== -1) {
                        viewedElem = card;
                        card.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
                    }

                    item.mark = () => {
                        const v = Lampa.Storage.cache(STORAGE.VIEWED, 5000, []);
                        if (v.indexOf(hashBehold) === -1) {
                            v.push(hashBehold);
                            Lampa.Storage.set(STORAGE.VIEWED, v);
                            if (card.find('.online-prestige__viewed').length === 0) {
                                card.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Lampa.Template.get('icon_viewed', {}, true) + '</div>');
                            }
                        }
                        const c = this.getChoice();
                        if (!isSerial) c.movie_view = hashBehold;
                        else c.episodes_view[item.season] = epNum;
                        this.saveChoice(c);
                        this.setWatched({
                            balanser: this.sourceName,
                            balanser_name: Lampa.Utils.capitalizeFirstLetter(this.sourceName),
                            voice_id: c.voice_id,
                            voice_name: c.voice_name || item.voice_name,
                            episode: item.episode,
                            season: item.season
                        });
                    };
                    item.unmark = () => {
                        const v = Lampa.Storage.cache(STORAGE.VIEWED, 5000, []);
                        if (v.indexOf(hashBehold) !== -1) {
                            Lampa.Arrays.remove(v, hashBehold);
                            Lampa.Storage.set(STORAGE.VIEWED, v);
                            if (Lampa.Manifest.app_digital >= 177) Lampa.Storage.remove(STORAGE.VIEWED, hashBehold);
                            card.find('.online-prestige__viewed').remove();
                        }
                    };
                    item.timeclear = () => {
                        item.timeline.percent  = 0;
                        item.timeline.time     = 0;
                        item.timeline.duration = 0;
                        Lampa.Timeline.update(item.timeline);
                    };

                    card.on('hover:enter', () => {
                        if (this.object.movie.id) Lampa.Favorite.add('history', this.object.movie, 100);
                        if (params.onEnter) params.onEnter(item, card, hashes);
                    }).on('hover:focus', (e) => {
                        this.active = e.target;
                        if (params.onFocus) params.onFocus(item, card, hashes);
                        this.background.update($(e.target), true);
                    });

                    if (params.onRender) params.onRender(item, card, hashes);

                    this.contextMenu({
                        html: card, element: item,
                        onFile: (f) => params.onContextMenu && params.onContextMenu(item, card, hashes, f),
                        onClearAllMark: () => items.forEach(i => i.unmark()),
                        onClearAllTime: () => items.forEach(i => i.timeclear())
                    });
                    this.background.append(card);
                });

                if (isSerial && tmdbEpisodes.length > items.length && !params.similars) {
                    const extra = tmdbEpisodes.slice(items.length);
                    extra.forEach(e => {
                        const info = [];
                        if (e.vote_average) info.push(Lampa.Template.get('online_prestige_rate', { rate: parseFloat(e.vote_average + '').toFixed(1) }, true));
                        if (e.air_date) info.push(Lampa.Utils.parseTime(e.air_date).short);
                        const date = new Date((e.air_date + '').replace(/-/g, '/'));
                        const daysLeft = Math.ceil((date.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                        const daysStr = Lampa.Lang.translate('full_episode_days_left') + ': ' + daysLeft;

                        const full = Lampa.Template.get('online_prestige_full', {
                            time: Lampa.Utils.secondsToTime((e ? e.runtime : this.object.movie.runtime) * 60, true),
                            info: info.length ? info.map(i => `<span>${i}</span>`).join('<span class="online-prestige-split">●</span>') : '',
                            title: e.name,
                            quality: daysLeft > 0 ? daysStr : ''
                        });
                        const body   = full.find('.online-prestige__body');
                        const imgBox = full.find('.online-prestige__img');
                        const season = items[0] ? items[0].season : 1;
                        full.find('.online-prestige__timeline').append(Lampa.Timeline.render(Lampa.Timeline.view(Lampa.Utils.hash([season, e.episode_number, this.object.movie.title].join('')))));
                        const img = full.find('img')[0];
                        if (e.still_path) {
                            img.onerror = () => img.src = './img/img_broken.svg';
                            img.onload = () => {
                                imgBox.addClass('online-prestige__img--loaded');
                                body.find('.online-prestige__loader').remove();
                                imgBox.append('<div class="online-prestige__episode-number">' + ('0' + e.episode_number).slice(-2) + '</div>');
                            };
                            img.src = Lampa.TMDB.image('t/p/w300' + e.still_path);
                            this.images.push(img);
                        } else {
                            body.find('.online-prestige__loader').remove();
                            imgBox.append('<div class="online-prestige__episode-number">' + ('0' + e.episode_number).slice(-2) + '</div>');
                        }
                        full.on('hover:focus', (e) => {
                            this.active = e.target;
                            this.background.update($(e.target), true);
                        });
                        this.background.append(full);
                    });
                }

                if (focusElem) this.active = focusElem[0];
                else if (viewedElem) this.active = viewedElem[0];
                Lampa.Controller.enable('content');
            });
        }

        contextMenu(data) {
            data.html.on('hover:long', () => {
                const buildMenu = (file) => {
                    const controller = Lampa.Controller.enabled().name;
                    const items = [];
                    if (Lampa.Platform.is('webos')) items.push({ title: Lampa.Lang.translate('title_action') + ' - Webos', player: 'webos' });
                    if (Lampa.Platform.is('android')) items.push({ title: Lampa.Lang.translate('title_action') + ' - Android', player: 'android' });
                    items.push({ title: Lampa.Lang.translate('title_action') + ' - Lampa', player: 'lampa' });
                    items.push({ title: Lampa.Lang.translate('settings_server_links'), separator: true });
                    items.push({ title: Lampa.Lang.translate('torrent_parser_label_title'), mark: true });
                    items.push({ title: Lampa.Lang.translate('torrent_parser_label_cancel_title'), unmark: true });
                    items.push({ title: Lampa.Lang.translate('time_reset'), timeclear: true });
                    if (file) items.push({ title: Lampa.Lang.translate('copy_link'), copylink: true });
                    items.push({ title: Lampa.Lang.translate('more'), separator: true });
                    if (Lampa.Storage.get('is_subscribed', false) && data.element && typeof data.element.season !== 'undefined' && data.element.translate_voice) {
                        items.push({ title: Lampa.Lang.translate('online_voice_subscribe'), subscribe: true });
                    }
                    items.push({ title: Lampa.Lang.translate('online_clear_all_marks'), clearallmark: true });
                    items.push({ title: Lampa.Lang.translate('online_clear_all_timecodes'), timeclearall: true });

                    Lampa.Select.show({
                        title: Lampa.Lang.translate('title_action'),
                        items,
                        onBack: () => Lampa.Controller.toggle(controller),
                        onSelect: (item) => {
                            if (item.mark)       data.element.mark();
                            if (item.unmark)     data.element.unmark();
                            if (item.timeclear)  data.element.timeclear();
                            if (item.clearallmark)   data.onClearAllMark();
                            if (item.timeclearall)   data.onClearAllTime();
                            Lampa.Controller.toggle(controller);
                            if (item.player) {
                                Lampa.Player.runas(item.player);
                                data.html.trigger('hover:enter');
                            }
                            if (item.copylink) {
                                if (file.quality) {
                                    const list = [];
                                    for (const q in file.quality) list.push({ title: q, file: file.quality[q] });
                                    Lampa.Select.show({
                                        title: Lampa.Lang.translate('title_quality'),
                                        items: list,
                                        onBack: () => Lampa.Controller.toggle(controller),
                                        onSelect: (q) => {
                                            Lampa.Utils.copyTextToClipboard(q.file,
                                                () => Lampa.Noty.show(Lampa.Lang.translate('copy_secuses')),
                                                () => Lampa.Noty.show(Lampa.Lang.translate('copy_fail')));
                                        }
                                    });
                                } else Lampa.Utils.copyTextToClipboard(file.file,
                                    () => Lampa.Noty.show(Lampa.Lang.translate('copy_secuses')),
                                    () => Lampa.Noty.show(Lampa.Lang.translate('copy_error')));
                            }
                            if (item.subscribe) {
                                Lampa.SubscribeToTranslation.add({
                                    card: this.object.movie,
                                    season: data.element.season,
                                    episode: data.element.translate_episode_end,
                                    voice: data.element.voice_id
                                },
                                () => Lampa.Noty.show(Lampa.Lang.translate('online_voice_success')),
                                () => Lampa.Noty.show(Lampa.Lang.translate('online_voice_error')));
                            }
                        }
                    });
                };
                data.onFile(buildMenu);
            }).on('hover:focus', () => {
                if (Lampa.Helper) Lampa.Helper.show('online_file', Lampa.Lang.translate('helper_online_file'), data.html);
            });
        }

        empty() {
            const tpl = Lampa.Template.get('online_does_not_answer', {});
            tpl.find('.online-empty__title').remove();
            tpl.find('.online-empty__buttons').append(Lampa.Lang.translate('online_balanser_dont_work'));
            this.background.append(tpl);
            this.loading(false);
        }
        doesNotAnswer() {
            this.reset();
            const tpl = Lampa.Template.get('online_does_not_answer', { balanser: this.sourceName });
            this.background.append(tpl);
            this.loading(false);
        }
        getLastEpisode(items) {
            let max = 0;
            items.forEach(i => { if (typeof i.episode !== 'undefined') max = Math.max(max, parseInt(i.episode)); });
            return max;
        }

        start() {
            if (Lampa.Activity.active().activity !== this.activity) return;
            if (!this.started) { this.started = true; this.initialize(); }
            Lampa.Broadcast.immediately(Lampa.Utils.hash(this.object.movie));
            Lampa.Controller.add('content', {
                toggle: () => {
                    Lampa.Controller.collectionSet(this.background.render(), this.explorer.render());
                    Lampa.Controller.collectionFocus(this.active || false, this.background.render());
                },
                up:    () => Navigator.canmove('up')    ? Navigator.move('up')    : Lampa.Controller.toggle('head'),
                down:  () => Navigator.move('down'),
                right: () => Navigator.canmove('right') ? Navigator.move('right') : this.filter.show(Lampa.Lang.translate('title_filter'), 'filter'),
                left:  () => Navigator.canmove('left')  ? Navigator.move('left')  : Lampa.Controller.toggle('menu'),
                gone:  () => clearInterval(this.timer),
                back:  () => Lampa.Activity.back()
            });
            Lampa.Controller.toggle('content');
        }
        back() { Lampa.Activity.back(); }
        stop() {}
        pause() {}
        destroy() {
            this.request.destroy();
            this.clearImages();
            this.explorer.destroy();
            this.background.destroy();
            clearInterval(this.timer);
            if (this.source && this.source.destroy) this.source.destroy();
            clearInterval(this._deviceTimer);
        }
    }

    // ============================================================
    //  РЕГИСТРАЦИЯ ПЛАГИНА
    // ============================================================
    const plugin = {
        type: 'video',
        version: '1.0.7',
        name: 'Онлайн - Filmix',
        description: 'Плагин для просмотра онлайн сериалов и фильмов',
        component: 'online_fxapi',
        onContextMenu: () => ({ name: Lampa.Lang.translate('online_watch'), description: '' }),
        onContextLauch: (card) => {
            initTemplates();
            Lampa.Component.add('online_fxapi', FilmixActivity);
            Lampa.Activity.push({
                url: '', title: Lampa.Lang.translate('title_online'),
                component: 'online_fxapi',
                search: card.title, search_one: card.title, search_two: card.original_title,
                movie: card, page: 1
            });
        }
    };
    Lampa.Plugins.add('online_filmix', plugin);

    // ============================================================
    //  ЛОКАЛИЗАЦИЯ (только ru и en)
    // ============================================================
    Lampa.Lang.add({
        online_watch:              { ru: 'Смотреть онлайн', en: 'Watch online' },
        online_video:              { ru: 'Видео',           en: 'Video' },
        online_nolink:             { ru: 'Не удалось извлечь ссылку', en: 'Failed to fetch link' },
        helper_online_file:        { ru: 'Удерживайте клавишу "ОК" для вызова контекстного меню', en: 'Hold the "OK" key to bring up the context menu' },
        title_online:              { ru: 'Онлайн',          en: 'Online' },
        modal_text:                { ru: 'Введите код на странице https://filmix.my/consoles', en: 'Enter the code on the page https://filmix.my/consoles' },
        modal_wait:                { ru: 'Ожидаем код',     en: 'Waiting for the code' },
        copy_secuses:              { ru: 'Код скопирован в буфер обмена', en: 'Code copied to clipboard' },
        copy_fail:                 { ru: 'Ошибка при копировании', en: 'Copy error' },
        title_status:              { ru: 'Статус',          en: 'Status' },
        online_voice_subscribe:    { ru: 'Подписаться на перевод', en: 'Subscribe to translation' },
        online_voice_success:      { ru: 'Вы успешно подписались', en: 'You have successfully subscribed' },
        online_voice_error:        { ru: 'Возникла ошибка', en: 'An error has occurred' },
        online_clear_all_marks:    { ru: 'Очистить все метки', en: 'Clear all labels' },
        online_clear_all_timecodes:{ ru: 'Очистить все тайм-коды', en: 'Clear all timecodes' },
        online_balanser_dont_work: { ru: 'Балансер не отвечает на запрос.', en: 'The balancer did not respond to the request.' },
        online_nostreams:          { ru: 'Контент найден, но ссылки на видео недоступны. Проверьте авторизацию Filmix.', en: 'Content found, but video links are unavailable. Check Filmix authorization.' },
        fxapi_proxy_title:         { ru: 'CORS прокси Filmix', en: 'Filmix CORS proxy' },
        fxapi_proxy_descr:         { ru: 'Прокси должен подменять User-Agent для filmixapp', en: 'Proxy must override User-Agent for filmixapp' },
        filmix_param_add_title:    { ru: 'Добавить ТОКЕН от Filmix', en: 'Add TOKEN from Filmix' },
        filmix_param_add_descr:    { ru: 'Добавьте ТОКЕН для подключения подписки', en: 'Add a TOKEN to connect a subscription' },
        filmix_param_placeholder:  { ru: 'Например: nxjekeb57385b..', en: 'For example: nxjekeb57385b..' },
        filmix_param_add_device:   { ru: 'Добавить устройство на Filmix', en: 'Add Device to Filmix' },
        filmix_nodevice:           { ru: 'Устройство не авторизовано', en: 'Device not authorized' },
        filmix_sub_free:           { ru: 'Бесплатно',       en: 'Free' },
        filmix_sub_days:           { ru: 'Осталось дней',   en: 'Days left' },
        filmix_max_quality:        { ru: 'Макс. качество',  en: 'Max quality' },
        filmix_video_server:       { ru: 'Видео сервер',    en: 'Video server' },
        fxapi_refresh_profile:     { ru: 'Обновить профиль Filmix', en: 'Refresh Filmix profile' },
        filmix_pro_until:          { ru: 'Подписка до',     en: 'Subscription until' },
        filmix_profile_updated:    { ru: 'Профиль Filmix обновлён', en: 'Filmix profile updated' }
    });

    // CSS профили
    Lampa.Template.add('fxapi_profile_css', `
        <style>
        .fxapi-profile{margin:1em 0;padding:1em;background:rgba(255,255,255,.08);border-radius:.6em;line-height:1.35}
        .fxapi-profile--empty{opacity:.75;padding:1.2em 1em}
        .fxapi-profile__wrap{display:flex;gap:1em;align-items:center}
        .fxapi-profile__avatar{width:4.5em;height:4.5em;border-radius:50%;overflow:hidden;background:rgba(0,0,0,.35);flex-shrink:0;display:flex;align-items:center;justify-content:center}
        .fxapi-profile__avatar img{width:100%;height:100%;object-fit:cover}
        .fxapi-profile__placeholder{font-size:1.8em;font-weight:600;text-transform:uppercase}
        .fxapi-profile__title{font-size:1.25em;font-weight:600}
        .fxapi-profile__login{opacity:.75;font-size:.95em;margin-top:.15em}
        .fxapi-profile__meta{opacity:.85;font-size:.92em;margin-top:.45em}
        .fxapi-profile__badge{display:inline-block;margin-bottom:.35em;padding:.15em .55em;border-radius:.3em;background:rgba(255,255,255,.14);font-size:.88em;font-weight:600}
        </style>`);
    $('body').append(Lampa.Template.get('fxapi_profile_css', {}, true));

    // Шаблоны
    Lampa.Template.add('online_prestige_full', `
        <div class="online-prestige online-prestige--full selector">
            <div class="online-prestige__img">
                <img alt="">
                <div class="online-prestige__loader"></div>
            </div>
            <div class="online-prestige__body">
                <div class="online-prestige__head">
                    <div class="online-prestige__title">{title}</div>
                    <div class="online-prestige__time">{time}</div>
                </div>
                <div class="online-prestige__timeline"></div>
                <div class="online-prestige__footer">
                    <div class="online-prestige__info">{info}</div>
                    <div class="online-prestige__quality">{quality}</div>
                </div>
            </div>
        </div>`);
    $('body').append(Lampa.Template.get('online_prestige_css', {}, true));

    function initTemplates() {
        Lampa.Template.add('online_prestige_folder', `
            <div class="online-prestige online-prestige--folder selector">
                <div class="online-prestige__folder">
                    <svg viewBox="0 0 128 112" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect y="20" width="128" height="92" rx="13" fill="white"></rect>
                        <path d="M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z" fill="white" fill-opacity="0.23"></path>
                        <rect x="11" y="8" width="106" height="76" rx="13" fill="white" fill-opacity="0.51"></rect>
                    </svg>
                </div>
                <div class="online-prestige__body">
                    <div class="online-prestige__head">
                        <div class="online-prestige__title">{title}</div>
                        <div class="online-prestige__time">{time}</div>
                    </div>
                    <div class="online-prestige__footer">
                        <div class="online-prestige__info">{info}</div>
                    </div>
                </div>
            </div>`);
        Lampa.Template.add('online_does_not_answer', `
            <div class="online-empty">
                <div class="online-empty__title" style="font-size: 2em; margin-bottom: .9em;">#{online_balanser_dont_work}</div>
                <div class="online-empty__templates">
                    <div class="online-empty-template"><div class="online-empty-template__ico"></div><div class="online-empty-template__body"></div></div>
                    <div class="online-empty-template"><div class="online-empty-template__ico"></div><div class="online-empty-template__body"></div></div>
                    <div class="online-empty-template"><div class="online-empty-template__ico"></div><div class="online-empty-template__body"></div></div>
                </div>
            </div>`);
        Lampa.Template.add('online_prestige_rate', `
            <div class="online-prestige-rate">
                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.39409 0.192139L10.99 5.30994L16.7882 6.20387L12.5475 10.4277L13.5819 15.9311L8.39409 13.2425L3.20626 15.9311L4.24065 10.4277L0 6.20387L5.79819 5.30994L8.39409 0.192139Z" fill="#fff"></path>
                </svg>
                <span>{rate}</span>
            </div>`);
    }

    // Кнопка "Смотреть онлайн"
    const buttonHtml = `<div class="full-start__button selector view--online" data-subtitle="Filmix v${plugin.version}">
        <svg width="135" height="147" viewBox="0 0 135 147" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M121.5 96.8823C139.5 86.49 139.5 60.5092 121.5 50.1169L41.25 3.78454C23.25 -6.60776 0.750004 6.38265 0.750001 27.1673L0.75 51.9742C4.70314 35.7475 23.6209 26.8138 39.0547 35.7701L94.8534 68.1505C110.252 77.0864 111.909 97.8693 99.8725 109.369L121.5 96.8823Z" fill="currentColor"/>
            <path d="M63 84.9836C80.3333 94.991 80.3333 120.01 63 130.017L39.75 143.44C22.4167 153.448 0.749999 140.938 0.75 120.924L0.750001 94.0769C0.750002 74.0621 22.4167 61.5528 39.75 71.5602L63 84.9836Z" fill="currentColor"/>
        </svg>
        <span>#{title_online}</span>
    </div>`;

    Lampa.Component.add('online_fxapi', FilmixActivity);
    initTemplates();

    // Кнопка в карточке фильма
    Lampa.Listener.follow('settings', (e) => {
        if (e.type === 'complite') {
            const btn = $(Lampa.Lang.translate(buttonHtml));
            btn.on('hover:enter', () => {
                initTemplates();
                Lampa.Component.add('online_fxapi', FilmixActivity);
                Lampa.Activity.push({
                    url: '', title: Lampa.Lang.translate('title_online'),
                    component: 'online_fxapi',
                    search: e.data.movie.title,
                    search_one: e.data.movie.title,
                    search_two: e.data.movie.original_title,
                    movie: e.data.movie, page: 1
                });
            });
            e.data.activity.render().find('.view--torrent').after(btn);
        }
    });

    // ============================================================
    //  НАСТРОЙКИ
    // ============================================================
    window.fxapi = { max_qualitie: QUALITY.FREE, is_max_qualitie: false };

    Lampa.Params.set(STORAGE.TOKEN, '', '');
    Lampa.SettingsApi.addComponent({
        component: 'fxapi',
        name: 'Filmix FX',
        icon: `<svg height="57" viewBox="0 0 58 57" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 20.3735V45H26.8281V34.1262H36.724V26.9806H26.8281V24.3916C26.8281 21.5955 28.9062 19.835 31.1823 19.835H39V13H26.8281C23.6615 13 20 15.4854 20 20.3735Z" fill="white"/>
            <rect x="2" y="2" width="54" height="53" rx="5" stroke="white" stroke-width="4"/>
        </svg>`
    });

    Lampa.Template.add('settings_fxapi', `
        <div>
            <div class="settings-param" data-name="fxapi_profile" data-static="true"></div>
            <div class="settings-param selector" data-name="fxapi_refresh" data-static="true">
                <div class="settings-param__name">#{fxapi_refresh_profile}</div>
            </div>
            <div class="settings-param selector" data-name="fxapi_token" data-type="input" placeholder="#{filmix_param_placeholder}">
                <div class="settings-param__name">#{filmix_param_add_title}</div>
                <div class="settings-param__value"></div>
                <div class="settings-param__descr">#{filmix_param_add_descr}</div>
            </div>
            <div class="settings-param selector" data-name="fxapi_add" data-static="true">
                <div class="settings-param__name">#{filmix_param_add_device}</div>
            </div>
        </div>`);

    // Обработчики настроек
    Lampa.Storage.listener.follow('change', (e) => {
        if (e.name === STORAGE.TOKEN) {
            window.fxapi.is_max_qualitie = true;
            if (e.value) fetchProfile(e.value);
            else {
                Lampa.Storage.set(STORAGE.STATUS, {});
                window.fxapi.max_qualitie = QUALITY.FREE;
                renderProfile();
            }
        }
    });

    Lampa.SettingsApi.listener.follow('open', (e) => {
        if (e.name !== 'fxapi') return;
        renderProfile();
        const token = getToken();
        if (token) fetchProfile(token);

        // Кнопка "Обновить профиль"
        e.body.find('[data-name="fxapi_refresh"]').toggleClass('selector').on('hover:enter', () => {
            const t = getToken();
            if (!t) { Lampa.Noty.show(Lampa.Lang.translate('filmix_nodevice')); return; }
            fetchProfile(t, (u) => { if (u) Lampa.Noty.show(Lampa.Lang.translate('filmix_profile_updated')); });
        });

        // Кнопка "Добавить устройство"
        e.body.find('[data-name="fxapi_add"]').toggleClass('selector').on('hover:enter', () => {
            const req = new Lampa.Reguest();
            let userCode = '', token = '';
            const modal = $(`<div><div class="broadcast__text">${Lampa.Lang.translate('modal_text')}</div>
                <div class="broadcast__device selector" style="text-align: center">${Lampa.Lang.translate('modal_wait')}</div></div>`);
            Lampa.Modal.open({
                title: '', html: modal,
                onBack: () => { Lampa.Modal.close(); Lampa.Controller.toggle('settings_component'); clearInterval(this._deviceTimer); },
                onSelect: () => {
                    Lampa.Utils.copyTextToClipboard(userCode,
                        () => Lampa.Noty.show(Lampa.Lang.translate('copy_secuses')),
                        () => Lampa.Noty.show(Lampa.Lang.translate('copy_fail')));
                }
            });
            this._deviceTimer = setInterval(() => {
                req.silent(buildUrl('user_profile', token), (res) => {
                    if (res && res.user_data) {
                        Lampa.Modal.close();
                        clearInterval(this._deviceTimer);
                        Lampa.Storage.set(STORAGE.TOKEN, token);
                        e.body.find('[data-name="fxapi_token"]').append(token);
                        fetchProfile(token);
                        Lampa.Controller.toggle('settings_component');
                    }
                });
            }, 2000);
            req.reset();
            req.timeout(10000);
            req.silent(buildUrl('token_request', ''), (res) => {
                if (res.status === 'ok') {
                    token    = res.token;
                    userCode = res.user_code;
                    modal.find('.broadcast__device').append(userCode);
                } else Lampa.Noty.show(res);
            }, (e, t) => Lampa.Noty.show(req.error(e, t)));
        });
    });

    // Автовход
    const savedToken = getToken();
    if (savedToken) fetchProfile(savedToken);

    // Синхронизация
    if (Lampa.Manifest.app_digital >= 177) Lampa.Storage.sync(STORAGE.CHOICE, 'object_object');

    console.log('[Filmix] Плагин инициализирован (v' + plugin.version + ')');
})();