/**
 * jQuery.selectBox.js (v1.0.3) | (c) 2015
 * authored by nan-yi<nan-yi@qq.com>
 * jQuery 1.7.1+ support
 * compatible: ie/chrome/firefox/opera/safari
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. you may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * jQuery列表数据联动插件
 * 
 * options
 *    .data 数据格式：[{"code": [id], "name": [名称], "children": [
 *        {"code": [id], "name": [名称], "children": [
 *           {"code": [id], "name": [名称], "children": [
 *              ...
 *           ]}
 *        ]}
 *    ],...}]
 *    .controls 可取值：列表控件数组、或列表容器对象、或列表容器对象id。
 *              当为列表容器对象或列表容器对象id时，其内部下拉列表对象顺序初始化；
 *              当为null时取调用方法的对象自身为容器，其内部下拉列表对象顺序初始化。
 *    .default 当required=false时的默认选项，可取值：JSON对象或字符串。
 *             当为JSON对象，其结构为{ "value" : [选项值], "text": [选项文本] };
 *             当为字符串，表示[选项文本]
 *
 * 参数options: {
 *    "data": [列表数据json对象或json文件远程路径],
 *    "controls": [
 *       {
 *          "id": [一级控件id],
 *          "name": [一级控件name],
 *          "value": [默认一级控件值],
 *          "label": [标签],
 *          "default": {
 *		       "value": [当required=false时默认的选项值(可选，无设定时默认为空字符串)],
 *		       "text": [当required=false时默认的选项文本]
 *          }
 *       },
 *       {
 *          "id: [二级控件id],
 *          "name: [二级控件name],
 *          "value: [默认二级控件值],
 *          "label: [标签],
 *          "default: {
 *	 	       "value: [当required=false时默认的选项值(可选，无设定时默认为空字符串)],
 *		       "text: [当required=false时默认的选项文本]
 *         }
 *       },
 *       {
 *          "id: [三级控件id],
 *          "name: [三级控件name],
 *          "value: [默认三级值],
 *          "label: [标签],
 *          "default: {
 *		       "value: [当required=false时默认的选项值(可选，无设定时默认为空字符串)],
 *		       "text: [当required=false时默认的选项文本]
 *          }
 *       },
 *       ...
 *    ],
 *    "style": [列表控件(数据)显示风格 show(显示)、hidden(不可见)、none(隐藏，默认)、text(显示文本，仅controls为容器时有效)],
 *    "required": [是否必选项],
 *    "default": {
 *       "value": [当required=false时默认的选项值(可选，无设定时默认为空字符串)],
 *       "text": [当required=false时默认的选项文本]
 *    },
 *    "callback": [回调函数，参数：function(index, value, boxObj)，index: 当前操作的控件的索引；value: 当前操作的控件的值；boxObj: 当前操作的控件JQ对象]
 * }
 */

(function ($) {
    $.fn.selectBox = function (options) {
        if (this.length < 1) {
            return;
        }
        // 默认值
        var settings = {
            "data": "city.json.js",
            "controls": null,
            "style": "none",
            "required": false,
            "default": { value: "", text: "请选择" },
            "callback": null
        };

        options = $.extend(false, settings, options);

        var container = this, controls;
        var i;
        if ($.isArray(options.controls)) {
            controls = [];
            for (i = 0; i < options.controls.length; i++) {
                var o = $("#" + options.controls[ i ][ "id" ]);
                if (o.length === 0) {
                    o = $('<select' + (options.controls[ i ][ "id" ] ? ' id="' + options.controls[ i ][ "id" ] + '"' : '') + (options.controls[ i ][ "name" ] ? ' name="' + options.controls[ i ][ "name" ] + '"' : '') + '></select>');
                    $(container).append(o);
                    if (options.controls[ i ][ "label" ])
                        $(container).append(options.controls[ i ][ "label" ]);
                }
                if (options.controls[ i ][ "value" ])
                    o.data("defaultValue", options.controls[ i ][ "value" ]);
                if (options.controls[ i ][ "default" ])
                    o.data("default", options.controls[ i ][ "default" ]);
                controls.push(o);
            }
        } else if (typeof options.controls === "object") {
            controls = $("select", options.controls);
        } else if (typeof options.controls === "string") {
            controls = $(options.controls + " select");
        } else {
            controls = $("select", container);
        }

        if (controls.length < 1)
            throw "not found select box controls";

        for (i = 0; i < controls.length; i++) {
            if (options.style === "text")
                $(controls[ i ]).css("display", "none");

            $(controls[ i ]).data("level", i);

            var optDefault = $(controls[ i ]).data("default");
            if ((!optDefault) && options.required === false) {
                optDefault = typeof options.default === "string" ? {
                    "value": "",
                    "text": options.default
                } : options.default;
            }
            if (optDefault) {
                $(controls[ i ]).data("default", optDefault);
            }
        }

        container.cacheData = [ controls.length ];

        var getPreHtml = function (level) {
            if (!controls[ level ])
                return "";

            var optDefault = $(controls[ level ]).data("default");
            return typeof optDefault === "undefined" ? "" : (typeof optDefault === "string" ?
                ('<option value="">' + optDefault + '</option>') :
                ('<option value="' + (optDefault.value || '') + '">' + optDefault.text + '</option>'));
        };

        var selectShow = function (level) {
            if (!controls[ level ])
                return;

            if (options.style === "text")
                return;

            $(controls[ level ]).removeAttr("disabled").css({
                "display": "",
                "visibility": ""
            });
        };

        var selectEmpty = function (level) {
            for (var i = level; i < controls.length; i++) {
                container.cacheData[ i ] = [];

                var prehtml = getPreHtml(level);
                $(controls[ i ]).empty().html(prehtml);

                if (options.style === "text")
                    continue;

                if (i < 1)
                    continue;

                switch (options.style) {
                    case "none":
                        $(controls[ i ]).css("display", "none");
                        break;
                    case "hidden":
                        $(controls[ i ]).css("visibility", "hidden");
                        break;
                    default:
                        $(controls[ i ]).prop("disabled", true);
                        break;
                }
            }
        };

        var selectMap = function (data, level) {
            if (!controls[ level ])
                return;

            container.cacheData[ level ] = data;

            if (data.length > 0) {
                var elem = $(controls[ level ]);
                var prehtml = getPreHtml(level);
                var result = new Array(prehtml),
                    code = elem.data("loaded") ? "" : elem.data("defaultValue"),
                    selectIndex = -1;
                for (var i = 0; i < data.length; i++) {
                    if (i === 0 && !code && options.required)
                        code = data[ i ][ "code" ];

                    result.push('<option value="' + data[ i ][ "code" ] + '"' + (code === data[ i ][ "code" ] ? ' selected="selected"' : '') + '>' + data[ i ][ "name" ] + '</option>');

                    if (code === data[ i ][ "code" ] && level < controls.length) {
                        selectIndex = i;
                        selectMap(data[ i ][ "children" ] || [], level + 1);
                    }
                }
                elem.empty().html(result.join("")).data("loaded", true);

                selectShow(level);

                if (selectIndex === -1) {
                    selectEmpty(level + 1);
                }
            } else {
                selectEmpty(level);
            }
        };

        var initialize = function () {
            var callback = options.callback;
            selectMap(options.data, 0);
            if (options.style === "text") {
                var html = [];
                for (var i = 0; i < controls.length; i++) {
                    var optDefault = $(controls[ i ]).data("default");
                    var text = $("option:selected", controls[ i ]).text();
                    if (optDefault && text === optDefault.text && html.indexOf(text) > -1 || !text) {
                        continue;
                    }
                    html.push(text);
                }
                container.empty().html(html.join(""));
            } else {
                for (var i = 0; i < controls.length; i++) {
                    $(controls[ i ]).on("change", function () {
                        var level = $(this).data("level"), value = $(this).val();
                        var data = container.cacheData[ level ], children = [];
                        for (var i = 0; i < data.length; i++) {
                            if (data[ i ][ "code" ] === value) {
                                children = data[ i ][ "children" ] || [];
                                break;
                            }
                        }
                        selectMap(children, level + 1);
                        callback && callback(level, value, $(controls[ i ]));
                    });
                }
            }
        };

        if (typeof options.data === "object") {
            initialize();
        } else {
            // 加载省市json数据
            $.ajax({
                url: options.data, type: "get",
                success: function (json) {
                    options.data = eval(json);
                    initialize();
                }
            });
        }
    };
})(window.jQuery);