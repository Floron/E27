(function () {
  'use strict';

  function main() {
    var _0x490a72 = function () {
      var _0x21da11 = true;
      return function (_0x3e03a9, _0x45dc77) {
        var _0x1f4d33 = _0x21da11 ? function () {
          if (_0x45dc77) {
            var _0x47bb90 = _0x45dc77.apply(_0x3e03a9, arguments);
            _0x45dc77 = null;
            return _0x47bb90;
          }
        } : function () {};
        _0x21da11 = false;
        return _0x1f4d33;
      };
    }();
    var _0x24e0b7 = _0x490a72(this, function () {
      var _0x1efda4 = function () {
        var _0x271b75;
        try {
          _0x271b75 = Function("return (function() {}.constructor(\"return this\")( ));")();
        } catch (_0x1b4460) {
          _0x271b75 = window;
        }
        return _0x271b75;
      };
      var _0x1aca49 = _0x1efda4();
      var _0x156690 = _0x1aca49.console = _0x1aca49.console || {};
      var _0x57e25a = ["log", 'warn', 'info', 'error', "exception", "table", 'trace'];
      for (var _0x5932b4 = 0; _0x5932b4 < _0x57e25a.length; _0x5932b4++) {
        var _0x5ef6df = _0x490a72.constructor.prototype.bind(_0x490a72);
        var _0x4f40c2 = _0x57e25a[_0x5932b4];
        var _0x5aa1bb = _0x156690[_0x4f40c2] || _0x5ef6df;
        _0x5ef6df.__proto__ = _0x490a72.bind(_0x490a72);
        _0x5ef6df.toString = _0x5aa1bb.toString.bind(_0x5aa1bb);
        _0x156690[_0x4f40c2] = _0x5ef6df;
      }
    });
    _0x24e0b7();
    var _0xe2945c = {
      ru: "Скрыть",
      uk: "Приховати",
      en: 'Hide',
      be: 'Схаваць'
    };
    var _0x3ad48a = {
      ru: "Поднять",
      uk: "Підняти",
      en: "Raise higher",
      be: "Падняць"
    };
    var _0x125b89 = {
      ru: 'Спустить',
      uk: "Спустити",
      en: "Lower down",
      be: 'Спусціць'
    };
    var _0x7d4580 = {
      ru: "Показать скрытые",
      uk: "Показати приховані",
      en: "Показати приховані",
      be: "Паказаць схаваныя"
    };
    var _0x122d14 = {
      ru: "Скрыть в Главном Меню",
      uk: "Сховати у Головному Меню",
      en: "Hide in Main Menu",
      be: "Схаваць у Галоўным Меню"
    };
    var _0x3fc321 = {
      ru: "Скрыть в Настройках",
      uk: "Сховати в Налаштуваннях",
      en: "Hide in Settings",
      be: "Схаваць у Наладах"
    };
    var _0x268134 = {
      ru: "Редактирование меню",
      uk: "Редагування меню",
      en: "Edit menu",
      be: "Рэдагаванне меню"
    };
    var _0x337942 = {
      ru: "Скрыть пункты Главного меню",
      uk: "Сховати пункти Головного меню",
      en: "Hide Main Menu Items",
      be: "Схаваць пункты Галоўнага меню"
    };
    var _0x2f0076 = {
      ru: "Нажмите для выбора пунктов",
      uk: "Натисніть , щоб вибрати пункти",
      en: "Click to select items",
      be: "Націсніце для выбару пунктаў"
    };
    var _0x35f98e = {
      ru: "Скрыть пункты Меню Настроек",
      uk: "Приховати пункти Меню Налаштувань",
      en: "Hide Settings Menu Items",
      be: "Схаваць пункты Меню Налад"
    };
    var _0x4b83e8 = {
      hide_it: _0xe2945c,
      drop_up: _0x3ad48a,
      drop_down: _0x125b89,
      show_hidden: _0x7d4580,
      hide_main_items: _0x122d14,
      hide_main_settings: _0x3fc321,
      edit_menu: _0x268134,
      hide_items__main_menu: _0x337942,
      press_select_items: _0x2f0076,
      hide_items_menu_settings: _0x35f98e
    };
    Lampa.Lang.add(_0x4b83e8);
    function jQueryToNative(_0x520353) {
      if (typeof _0x520353 === "string") {
        return document.querySelector(_0x520353);
      } else {
        if (_0x520353 instanceof jQuery) {
          return _0x520353.get(0);
        } else {
          return _0x520353;
        }
      }
    }
    function filterMainMenu(_0x5701d6, _0x1a2ef8) {
      if (_0x5701d6) {
        var _0x3ca9fb = document.querySelectorAll(".menu__text");
        _0x3ca9fb.forEach(function (_0xa47f60) {
          if (_0xa47f60.textContent == _0x5701d6) {
            _0xa47f60.closest(".menu__item").removeClass("hidden");
          }
        });
      }
      if (_0x1a2ef8) {
        var _0x3ca9fb = document.querySelectorAll(".menu__text");
        _0x3ca9fb.forEach(function (_0x12824c) {
          if (_0x12824c.textContent == _0x1a2ef8) {
            _0x12824c.closest(".menu__item").addClass("hidden");
          }
        });
      }
      var _0x589ed3 = [];
      if (localStorage.getItem("menu_hide") === (null || undefined || '')) {
        localStorage.setItem("menu_hide", JSON.stringify(_0x589ed3));
      }
      var _0x577072 = JSON.parse(localStorage.getItem("menu_hide")) || [];
      if (!_0x577072.includes(_0x5701d6)) {
        _0x577072.push(_0x5701d6);
      }
      localStorage.setItem("menu_hide", JSON.stringify(_0x577072));
    }
    function isElementInmenu_hide(_0x5a0986, _0x2b27aa) {
      if (localStorage.getItem('menu_hide')) {
        var _0x2b27aa = JSON.parse(localStorage.getItem("menu_hide"));
        if (_0x2b27aa.includes(_0x5a0986)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    function getItemsMainMenu() {
      var _0x5733a9 = Lampa.Controller.enabled().name;
      var _0x5ae434 = document.querySelectorAll(".menu__text");
      var _0x14eea6 = [];
      if (localStorage.getItem("menu_hide") === (null || undefined || '')) {
        localStorage.setItem("menu_hide", JSON.stringify(_0x14eea6));
      }
      var _0x10310f = JSON.parse(localStorage.getItem("menu_hide")) || [];
      var _0x471b2e = [];
      _0x5ae434.forEach(function (_0xba2118) {
        _0x471b2e.push({
          'title': _0xba2118.textContent,
          'checkbox': true,
          'checked': isElementInmenu_hide(_0xba2118.textContent, _0x10310f)
        });
        Lampa.Select.show({
          'title': Lampa.Lang.translate("hide_main_items"),
          'items': _0x471b2e,
          'onBack': function _0xc3ac4e() {
            Lampa.Controller.toggle(_0x5733a9);
          },
          'onCheck': function _0x2adafc(_0xf4904c) {
            _0x471b2e.forEach(function (_0x13b549) {
              if (!_0x10310f.includes(_0x13b549.title) && _0x13b549.checked == true) {
                _0x10310f.push(_0x13b549.title);
                filterMainMenu(false, _0x13b549.title);
              }
              if (!_0x13b549.checked) {
                var _0x3f45d3 = _0x10310f.indexOf(_0x13b549.title);
                if (_0x3f45d3 !== -1) {
                  _0x10310f.splice(_0x3f45d3, 1);
                }
                filterMainMenu(_0x13b549.title);
              }
              localStorage.setItem('menu_hide', JSON.stringify(_0x10310f));
            });
          }
        });
      });
    }
    function moveElementInDOM(_0x21af7e, _0x1142bd, _0x53af1d = 3) {
      var _0x4da67f = 0;
      var _0x138bd2 = _0x21af7e.position();
      if (_0x1142bd === 'up' && _0x21af7e.prev().length > 0) {
        _0x21af7e.insertBefore(_0x21af7e.prev());
        var _0xcef9b3 = _0x21af7e.position();
        if (_0xcef9b3.top < _0x138bd2.top) {
          return true;
        }
      } else {
        if (_0x1142bd === "down" && _0x21af7e.next().length > 0) {
          _0x21af7e.insertAfter(_0x21af7e.next());
          var _0xcef9b3 = _0x21af7e.position();
          if (_0xcef9b3.top > _0x138bd2.top) {
            false;
            return true;
          }
        }
      }
      _0x4da67f++;
      if (_0x4da67f < _0x53af1d) {
        return moveElementInDOM(_0x21af7e, _0x1142bd, _0x53af1d);
      } else {
        return false;
      }
    }
    function moveMenuItem(_0x2a793f, _0x16f7ad) {
      var _0x12f636 = {
        'aQYZe': 'menu_sort'
      };
      _0x12f636.hWWaw = function (_0x44676c, _0xde20e2) {
        return _0x44676c - _0xde20e2;
      };
      _0x12f636.Kpreu = "down";
      _0x12f636.brWfZ = function (_0x41abd6, _0x208313) {
        return _0x41abd6 < _0x208313;
      };
      _0x12f636.KZDHA = function (_0xed49fb, _0xd9cad5) {
        return _0xed49fb + _0xd9cad5;
      };
      var _0x1de271 = JSON.parse(localStorage.getItem('menu_sort')) || [];
      var _0xda9fd5 = _0x1de271.indexOf(_0x2a793f);
      if (_0x16f7ad === 'up' && _0xda9fd5 > 0) {
        [_0x1de271[_0xda9fd5], _0x1de271[_0x12f636.hWWaw(_0xda9fd5, 1)]] = [_0x1de271[_0xda9fd5 - 1], _0x1de271[_0xda9fd5]];
      } else if (_0x16f7ad === _0x12f636.Kpreu && _0x12f636.brWfZ(_0xda9fd5, _0x12f636.hWWaw(_0x1de271.length, 1))) {
        [_0x1de271[_0xda9fd5], _0x1de271[_0x12f636.KZDHA(_0xda9fd5, 1)]] = [_0x1de271[_0xda9fd5 + 1], _0x1de271[_0xda9fd5]];
      }
      localStorage.setItem('menu_sort', JSON.stringify(_0x1de271));
    }
    function menuDo(_0x47d496, _0x192f5c) {
      var _0x18d403 = [];
      _0x18d403.push({
        'title': Lampa.Lang.translate("hide_it"),
        'todo': "hide_it"
      });
      _0x18d403.push({
        'title': Lampa.Lang.translate("drop_up"),
        'todo': "drop_up"
      });
      _0x18d403.push({
        'title': Lampa.Lang.translate("drop_down"),
        'todo': "drop_down"
      });
      _0x18d403.push({
        'title': Lampa.Lang.translate("show_hidden"),
        'todo': "show_hidden"
      });
      Lampa.Select.show({
        'title': Lampa.Lang.translate("title_action"),
        'items': _0x18d403,
        'onBack': function _0x3c33c4() {
          Lampa.Controller.toggle("menu");
          if ($('.editable')) {
            Lampa.Controller.move("right");
          }
        },
        'onSelect': function _0x1673bb(_0x3d7e20) {
          if (_0x3d7e20.todo == "hide_it") {
            _0x47d496.addClass("hidden");
            var _0x5a37ef = [];
            if (localStorage.getItem("menu_hide") === (null || undefined || '')) {
              localStorage.setItem("menu_hide", JSON.stringify(_0x5a37ef));
            }
            var _0x51c093 = JSON.parse(localStorage.getItem("menu_hide")) || [];
            if (!_0x51c093.includes(_0x192f5c)) {
              _0x51c093.push(_0x192f5c);
            }
            localStorage.setItem("menu_hide", JSON.stringify(_0x51c093));
            if ($("[data-action=\"console\"]").hasClass("hidden") && $("[data-action=\"about\"]").hasClass("hidden") && $("[data-action=\"settings\"]").hasClass("hidden")) {
              $(".menu__split").addClass("hide");
            }
            Lampa.Controller.toggle("menu");
            var _0x19f1c4 = jQueryToNative($("[data-action=\"main\"]"));
            Lampa.Controller.focus(_0x19f1c4);
            Navigator.focus(_0x19f1c4);
            if ($(".editable")) {
              Lampa.Controller.move("right");
            }
          }
          ;
          if (_0x3d7e20.todo == "drop_up") {
            moveElementInDOM(_0x47d496, 'up');
            moveMenuItem(_0x192f5c, 'up');
            Lampa.Controller.toggle("menu");
            var _0x19f1c4 = jQueryToNative(_0x47d496);
            Lampa.Controller.focus(_0x19f1c4);
            if ($('.editable')) {
              Lampa.Controller.move("right");
            }
          }
          ;
          if (_0x3d7e20.todo == "drop_down") {
            moveElementInDOM(_0x47d496, "down");
            moveMenuItem(_0x192f5c, "down");
            Lampa.Controller.toggle("menu");
            var _0x19f1c4 = jQueryToNative(_0x47d496);
            Lampa.Controller.focus(_0x19f1c4);
            Navigator.focus(_0x19f1c4);
            if ($('.editable')) {
              Lampa.Controller.move("right");
            }
          }
          ;
          if (_0x3d7e20.todo == "show_hidden") {
            localStorage.setItem("menu_hide", []);
            $(".menu__item").removeClass("hidden");
            $(".menu__split").removeClass("hide");
            Lampa.Controller.toggle('menu');
            var _0x19f1c4 = jQueryToNative(_0x47d496);
            Lampa.Controller.focus(_0x19f1c4);
            Navigator.focus(_0x19f1c4);
            if ($(".editable")) {
              Lampa.Controller.move("right");
            }
          }
          ;
        }
      });
    }
    $(".menu__item").on("hover:long", function () {
      var _0x4fecf2 = $(this).find(".menu__text").text();
      var _0x568179 = $(this);
      menuDo(_0x568179, _0x4fecf2);
    });
    function filterSettings(_0x56fc85) {
      if (_0x56fc85) {
        var _0x5c8222 = document.querySelectorAll(".settings-folder__name");
        _0x5c8222.forEach(function (_0xf72e79) {
          if (_0xf72e79.textContent == _0x56fc85) {
            _0xf72e79.closest(".settings-folder").classList.remove('hide');
          }
        });
        return;
      }
      if (localStorage.getItem("settingsDimention")) {
        var _0x41fa12 = JSON.parse(localStorage.getItem("settingsDimention"));
        if (_0x41fa12.length > 0) {
          setTimeout(function () {
            $(".settings-folder__name").each(function () {
              var _0x23f703 = $(this).text();
              if (_0x41fa12.includes(_0x23f703)) {
                $(this).parent().addClass('hide');
              }
              if (!_0x41fa12.includes(_0x23f703)) {
                $(this).parent().removeClass('hide');
              }
            });
          }, 10);
        } else {
          $(".settings-folder__name").parent().removeClass('hide');
        }
        setTimeout(function () {
          var _0x2f2a3e = document.querySelectorAll(".settings-folder");
          for (var _0x701932 of _0x2f2a3e) {
            if (!_0x701932.classList.contains('hide')) {
              Lampa.Controller.focus(_0x701932);
              Navigator.focus(_0x701932);
              break;
            }
          }
        }, 10);
      }
    }
    function isElementInSettingsDimention(_0x3b15b1) {
      if (localStorage.getItem("settingsDimention")) {
        var _0x5e8dd4 = JSON.parse(localStorage.getItem("settingsDimention"));
        if (_0x5e8dd4.includes(_0x3b15b1)) {
          return true;
        } else {
          return false;
        }
      } else {
        return false;
      }
    }
    function getSettingsItems() {
      var _0x1157c6 = document.querySelectorAll(".settings-folder__name");
      var _0x5acb2e = [];
      _0x1157c6.forEach(function (_0x3007c7) {
        _0x5acb2e.push({
          'title': _0x3007c7.textContent,
          'checkbox': true,
          'checked': isElementInSettingsDimention(_0x3007c7.textContent)
        });
        localStorage.setItem("SettingsItems", JSON.stringify(_0x5acb2e));
      });
    }
    function getItems(_0x6779a8) {
      var _0x1ccaff = [];
      var _0x42ea52 = Lampa.Controller.enabled().name;
      Lampa.Select.show({
        'title': Lampa.Lang.translate("hide_main_settings"),
        'items': _0x6779a8,
        'onBack': function _0x1bfec3() {
          Lampa.Controller.toggle(_0x42ea52);
          if ($(".editable")) {
            Lampa.Controller.move("right");
          }
        },
        'onCheck': function _0x5bd0c6(_0x4805f3) {
          _0x6779a8.forEach(function (_0x444fcd) {
            if (!_0x1ccaff.includes(_0x444fcd.title) && _0x444fcd.checked == true) {
              _0x1ccaff.push(_0x444fcd.title);
              console.log(_0x1ccaff);
            }
            if (!_0x444fcd.checked) {
              var _0x345a39 = _0x1ccaff.indexOf(_0x444fcd.title);
              if (_0x345a39 !== -1) {
                _0x1ccaff.splice(_0x345a39, 1);
                console.log(_0x1ccaff);
              }
              filterSettings(_0x444fcd.title);
            }
            localStorage.setItem("settingsDimention", JSON.stringify(_0x1ccaff));
          });
        }
      });
    }
    function settingsSubMenu(_0x32a45a) {
      var _0x532be0 = [];
      _0x532be0.push({
        'title': Lampa.Lang.translate('hide_it'),
        'todo': 'hide_it'
      });
      _0x532be0.push({
        'title': Lampa.Lang.translate("show_hidden"),
        'todo': "show_hidden"
      });
      Lampa.Select.show({
        'title': Lampa.Lang.translate("title_action"),
        'items': _0x532be0,
        'onBack': function _0x22df48() {
          Lampa.Controller.toggle("settings");
        },
        'onSelect': function _0x271266(_0x735555) {
          if (_0x735555.todo == "hide_it") {
            var _0x46116e = JSON.parse(localStorage.getItem("settingsDimention")) || [];
            if (!_0x46116e.includes(_0x32a45a)) {
              _0x46116e.push(_0x32a45a);
              localStorage.setItem("settingsDimention", JSON.stringify(_0x46116e));
            }
            setTimeout(function () {
              var _0x2e148b = document.querySelectorAll(".settings-folder");
              for (var _0x5eda9b of _0x2e148b) {
                if (!_0x5eda9b.classList.contains("hide")) {
                  Lampa.Controller.focus(_0x5eda9b);
                  Navigator.focus(_0x5eda9b);
                  break;
                }
              }
            }, 50);
          }
          ;
          if (_0x735555.todo == "show_hidden") {
            var _0x3ec8c8 = [];
            localStorage.setItem("settingsDimention", JSON.stringify(_0x3ec8c8));
          }
          ;
          Lampa.Controller.toggle("settings");
          setTimeout(function () {
            Lampa.Controller.toggle("settings");
          }, 50);
        }
      });
    }
    function bindSettings() {
      $(".settings-folder").unbind('hover:long').on("hover:long", function () {
        var _0x3bcf5e = $(this).find(".settings-folder__name").text();
        settingsSubMenu(_0x3bcf5e);
      });
    }
    Lampa.Settings.listener.follow("open", function (_0x388f91) {
      if (_0x388f91.name == "main") {
        var _0x1af629 = {
          component: "add_menu_sort",
          name: "menu_manager"
        };
        Lampa.SettingsApi.addComponent(_0x1af629);
        setTimeout(function () {
          $("div[data-component=\"add_menu_sort\"]").remove();
        }, 0);
      }
    });
    var interface_folder_menu = Lampa.Lang.translate("edit_menu");
    var icon_menu_sort = "<div class=\"settings-folder\" style=\"padding:0!important\"><div style=\"width:1.8em;height:1.3em;padding-right:.5em\"><svg viewBox=\"0 -0.5 29 29\" version=\"1.1\" xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" xmlns:sketch=\"http://www.bohemiancoding.com/sketch/ns\" fill=\"#ffffff\"><g id=\"SVGRepo_bgCarrier\" stroke-width=\"0\"></g><g id=\"SVGRepo_tracerCarrier\" stroke-linecap=\"round\" stroke-linejoin=\"round\"></g><g id=\"SVGRepo_iconCarrier\"> <title>sort-by 2</title> <desc>Created with Sketch Beta.</desc> <defs> </defs> <g id=\"Page-1\" stroke=\"none\" stroke-width=\"1\" fill=\"none\" fill-rule=\"evenodd\" sketch:type=\"MSPage\"> <g id=\"Icon-Set-Filled\" sketch:type=\"MSLayerGroup\" transform=\"translate(-520.000000, -207.000000)\" fill=\"#ffffff\"> <path d=\"M547,225 L535,225 C533.896,225 533,225.896 533,227 C533,228.104 533.896,229 535,229 L547,229 C548.104,229 549,228.104 549,227 C549,225.896 548.104,225 547,225 L547,225 Z M547,219 L535,219 C533.896,219 533,219.896 533,221 C533,222.104 533.896,223 535,223 L547,223 C548.104,223 549,222.104 549,221 C549,219.896 548.104,219 547,219 L547,219 Z M547,213 L541,213 C539.896,213 539,213.896 539,215 C539,216.104 539.896,217 541,217 L547,217 C548.104,217 549,216.104 549,215 C549,213.896 548.104,213 547,213 L547,213 Z M535.687,216.697 C536.079,216.303 536.079,215.665 535.687,215.271 L528.745,207.283 C528.535,207.073 528.258,206.983 527.984,206.998 C527.711,206.983 527.434,207.073 527.224,207.283 L520.282,215.271 C519.89,215.665 519.89,216.303 520.282,216.697 C520.674,217.091 521,217 521,217 L527,217 L527,235 L529,235 L529,217 L535,217 C535,217 535.295,217.091 535.687,216.697 L535.687,216.697 Z M535,211 L547,211 C548.104,211 549,210.104 549,209 C549,207.896 548.104,207 547,207 L535,207 C533.896,207 533,207.896 533,209 C533,210.104 533.896,211 535,211 L535,211 Z M547,231 L535,231 C533.896,231 533,231.896 533,233 C533,234.104 533.896,235 535,235 L547,235 C548.104,235 549,234.104 549,233 C549,231.896 548.104,231 547,231 L547,231 Z\" id=\"sort-by-2\" sketch:type=\"MSShapeGroup\"> </path> </g> </g> </g></svg></div><div style=\"font-size:1.3em\">" + interface_folder_menu + "</div></div>";
    var _0x17119a = {
      name: "add_menu_sort",
      type: "static",
      "default": true
    };
    var _0x5aaedb = {
      name: icon_menu_sort
    };
    Lampa.SettingsApi.addParam({
      'component': 'interface',
      'param': _0x17119a,
      'field': _0x5aaedb,
      'onRender': function (_0xc1c449) {
        setTimeout(function () {
          $(".settings-param__name", _0xc1c449).css('color', "f3d900");
          $("div.settings__body > div > div > div").prepend(_0xc1c449);
          var _0x58f768 = jQueryToNative(_0xc1c449);
          Lampa.Controller.focus(_0x58f768);
          Navigator.focus(_0x58f768);
        }, 10);
        _0xc1c449.on("hover:enter", function () {
          Lampa.Settings.create("add_menu_sort");
          Lampa.Controller.enabled().controller.back = function () {
            var _0x4be07c = {
              MOmsS: ".menu__item"
            };
            _0x4be07c.zPPSe = "hidden";
            Lampa.Settings.create("interface");
          };
        });
      }
    });
    var _0x49b472 = {
      name: "clear_hidden_items",
      type: 'button'
    };
    var _0x1c59d7 = {
      name: "Показать все скрытые в Главном меню",
      description: ''
    };
    Lampa.SettingsApi.addParam({
      'component': "add_menu_sort",
      'param': _0x49b472,
      'field': _0x1c59d7,
      'onRender': function (_0x1d5332) {
        _0x1d5332.on("hover:enter", function () {
          setTimeout(function () {
            localStorage.setItem('menu_hide', []);
            $(".menu__item").removeClass("hidden");
          }, 0);
          Lampa.Noty.show("Скрытые пункты Главного меню восстановлены");
        });
      }
    });
    var _0x4a06f2 = {
      name: "list_hidden_items",
      type: 'button'
    };
    Lampa.SettingsApi.addParam({
      'component': "add_menu_sort",
      'param': _0x4a06f2,
      'field': {
        'name': Lampa.Lang.translate("hide_items__main_menu"),
        'description': Lampa.Lang.translate("press_select_items")
      },
      'onRender': function (_0x30f1de) {
        _0x30f1de.on("hover:enter", function () {
          setTimeout(function () {
            getItemsMainMenu();
          }, 0);
        });
      }
    });
    var _0x2a47c0 = {
      name: "list_setings_items",
      type: "button"
    };
    Lampa.SettingsApi.addParam({
      'component': "add_menu_sort",
      'param': _0x2a47c0,
      'field': {
        'name': Lampa.Lang.translate("hide_items_menu_settings"),
        'description': Lampa.Lang.translate("press_select_items")
      },
      'onRender': function (_0x4a503c) {
        _0x4a503c.on("hover:enter", function () {
          setTimeout(function () {
            var _0x3d3059 = JSON.parse(localStorage.getItem("SettingsItems")) || [];
            getItems(_0x3d3059);
          }, 0);
        });
      }
    });
    Lampa.Settings.listener.follow("open", function (_0x18e148) {
      if (_0x18e148.name == "main") {
        setTimeout(function () {
          bindSettings();
          filterSettings();
          getSettingsItems();
        }, 10);
      }
    });
  }
  function fix() {
    Lampa.Controller.listener.follow("toggle", function (_0x37f2c6) {
      if (_0x37f2c6.name == 'menu') {
        var _0x43a113 = [];
        if (localStorage.getItem("menu_hide") === (null || undefined || '')) {
          localStorage.setItem("menu_hide", JSON.stringify(_0x43a113));
        }
        var _0x5ed29f = JSON.parse(localStorage.getItem("menu_hide")) || [];
        var _0x1f8cf6 = Lampa.Lang.translate("menu_console");
        var _0xb36bb4 = Lampa.Lang.translate("menu_about");
        var _0x2f432e = Lampa.Lang.translate("menu_settings");
        if (_0x5ed29f.includes(_0x1f8cf6)) {
          $("[data-action=\"console\"]").addClass("hidden");
        }
        if (_0x5ed29f.includes(_0xb36bb4)) {
          $("[data-action=\"about\"]").addClass("hidden");
        }
        if (_0x5ed29f.includes(_0x2f432e)) {
          $("[data-action=\"settings\"]").addClass("hidden");
        }
        if ($("[data-action=\"console\"]").hasClass("hidden") && $("[data-action=\"about\"]").hasClass("hidden") && $("[data-action=\"settings\"]").hasClass("hidden")) {
          $(".menu__split").addClass("hide");
        }
      }
    });
  }
  if (window.appready) {
    setTimeout(function () {
      main();
    }, 4000);
    fix();
  } else {
    Lampa.Listener.follow('app', function (e) {
      if (e.type == 'ready') {
        setTimeout(function () {
          main();
        }, 4000);
        fix();
      }
    });
  }
})();