(function(window, $) {
	$.isAllowAuto = true;
	$('#savePackageBtn').bind('click', function() {
		$.isAllowAuto = true;
	});
	if (!window.sohuAD) {
		window.sohuAD = {};
	}
	var sohuAD = window.sohuAD;
	function apply(o, c, defaults) {
		if (defaults) {
			applay(o, defaults);
		}
		if (o && c && typeof c == 'object') {
			for (var p in c) {
				o[p] = c[p];
			}
		}
	}

	function builddate(y, m, d, perten) {
		var ms = m, ds = d;
		var p = "-";
		if (perten) {
			p = perten;
		}
		if (m < 10) {
			ms = '0' + m;
		}
		if (d < 10) {
			ds = "0" + d;
		}
		return y + p + ms + p + ds;
	}

	/**
	 *	@author ql434
	 * 	@desp 构建日历矩阵
	 * 	@return 一个月的每天的数据 在矩阵中的位置
	 */

	var dateUtil = {
		getDaysInMonth : function(y, m) {
			month = parseInt(m, 10) + 1;
			var temp = new Date(y + '/' + month + '/0');
			return temp.getDate();
		},
		getPos : function(year, month, day) {
			var d = new Date(year + '/' + month + '/' + 1), weekNum = d.getDay(), n = weekNum + parseInt(day) - 1, pos = [];
			pos.push(Math.floor(n / 7));
			pos.push(n % 7);
			return pos;
		},
		getMonDetails : function(year, month) {
			var daysInMonth = dateUtil.getDaysInMonth(year, month), i = 0, monthOb = {}, temp;
			for (i; i < daysInMonth; i++) {
				temp = dateUtil.getPos(year, month, i + 1);
				monthOb[i + 1] = temp;
			}
			return monthOb;
		}
	};

	sohuAD.Calendar = function(el, config) {
		if ( typeof el == 'string') {
			el = '#' + el;
		}
		this.el = $(el);
		var d = new Date();
		apply(this, config);
		this.config = config || {};
		this.url = this.config.url;
		this.y = this.config.y || d.getFullYear();
		this.m = this.config.m || d.getMonth() + 1;
		this.checkModel = this.config.checkModel;
		this.cellMinHeight = this.config.cellMinHeight || '50px';
		this.daysValue = [];
		this.bookPackageId = this.config.bookPackageId;
		this.saleResId = this.config.saleResId;
		this.projectId = this.config.projectId;
		this.show = false;
		//默认红色样式
		this.selectedStyle = this.config.selectedStyle || "red";
		/**
		 * @数据形式   {"2014-9":{},"2014-10":{}}
		 */
		this.data = this.config.data || {};
		this.showElmID = this.config.showElmID || "";

	};

	sohuAD.Calendar.prototype = {

		constructor : sohuAD.Calendar,

		dayName : ['日', '一', '二', '三', '四', '五', '六'],

		monthName : {
			1 : '1月',
			2 : '2月',
			3 : '3月',
			4 : '4月',
			5 : '5月',
			6 : '6月',
			7 : '7月',
			8 : '8月',
			9 : '9月',
			10 : '10月',
			11 : '11月',
			12 : '12月'
		},
		preText : '&nbsp;&#9668;月&nbsp;',

		nextText : '&nbsp;月&#9658;&nbsp;',

		preYearText : '&nbsp;&#9650;年&nbsp;',

		nextYearText : '&nbsp;&#9660;年&nbsp;',

		todayText : '今天',
		//建立当月数组矩阵
		calcDays : function() {
			var i = 0, y = this.y, m = this.m, fd = new Date(y / 1, (m - 1) / 1, 1), ld = new Date(y / 1, m, 0), total = ld.getDate(), fday = fd.getDay();
			this.daysValue = [];
			for (; i < total; i++) {
				//构建稀疏数组
				this.daysValue[i + fday] = i + 1;
			}
		},
		//加载当月数据
		initCurMon : function() {
			var monthOb = dateUtil.getMonDetails(this.y, this.m);
			this.data[this.y + "-" + this.m] = monthOb;
		},
		/**
		 * @data={"2014-2":[undefined,undefined,{dayNo:1,isSelecte:true},{dayNo:2,isSelected:false},.....,{dayNo:30,isSelected:true}],"2014-3":{}}
		 * @desp 传入数据就加载数据，没数据就加载当月；
		 */
		buildData : function(isFirst) {

			//默认不传入参数 isFirst:false
			var isFirst = arguments[0] ? true : false;
			var i = 0, year = this.y, month = this.m, fd = new Date(year / 1, (month - 1) / 1, 1), ld = new Date(year / 1, month, 0), total = ld.getDate(), fday = fd.getDay(), $td, temp = [], selectedStyle = this.selectedStyle;
			console.log(fday);
			for (; i < total; i++) {
				var obj = {};
				//构建稀疏数组
				obj.dayNo = i + 1;
				temp[i + fday] = obj;
			}
			if (isFirst) {
				$td = $("[index]");
				$td.each(function() {
					var index = $(this).attr("index");
					console.log("扫描td:" + $(this).hasClass(selectedStyle));
					$(this).hasClass(selectedStyle) ? temp[index].isSelected = true : "";
				});
			};
			this.data[year + "-" + month] = temp;
			var msg = isFirst ? "首次构建数据" : "刷新数据";
			console.log(msg)
			return temp;
		},
		init : function() {
			this.el.addClass('fc');
			this.calcDays();
			this.buildData();
		},
		clearSelectMore : function() {
			var selectMores = $(".selectmore");
			selectMores.attr("checked", false).each(function() {
				$(this).triggerHandler('click');
			});
		},
		initTitle : function() {
			var title = [], mm = this;
			title.push('<table class="fc-header" style="width:100%;">', '<tbody>', '<tr>', '<td class="fc-header-left">', '<span id="x-m-pre" class="fc-button fc-button-prev fc-state-default fc-content-left">', '<span class="fc-button-inner">', '<span class="fc-button-content">', this.preText, '</span>', '<span class="fc-button-effect"><span></span></span>', '</span>', '</span>', '<span id="x-m-next" class="fc-button fc-button-next fc-state-default fc-content-right">', '<span class="fc-button-inner">', '<span class="fc-button-content">', this.nextText, '</span>', '<span class="fc-button-effect"><span></span></span>', '</span>', '</span>', '<span class="fc-header-space"></span>', '<span id="x-c-today" class="fc-button fc-button-today fc-state-default fc-content-left fc-content-right">', '<span class="fc-button-inner">', '<span class="fc-button-content">', this.todayText, '</span>', '<span class="fc-button-effect"><span></span></span>', '</span>', '</span>', '</td>', '<td class="fc-header-center">', '<span class="fc-header-title">', '<h2>', this.y, ' 年   ', this.monthName[this.m], '</h2>', '</span>', '</td>', '<td class="fc-header-right">', '<span id="x-y-pre" class="fc-button fc-button-prev fc-state-default fc-content-left">', '<span class="fc-button-inner">', '<span class="fc-button-content">', this.preYearText, '</span>', '<span class="fc-button-effect"><span></span></span>', '</span>', '</span>', '<span id="x-y-next" class="fc-button fc-button-next fc-state-default fc-content-right">', '<span class="fc-button-inner">', '<span class="fc-button-content">', this.nextYearText, '</span>', '<span class="fc-button-effect"><span></span></span>', '</span>', '</span>', '</td>', '</tr></tbody></table>');
			this.el.append(title.join(''));

			this.titleField = this.el.find('span.fc-header-title h2');

			$('#x-m-pre').hover(function() {
				$(this).addClass('fc-state-hover');
			}, function() {
				$(this).removeClass('fc-state-hover');
			}).click(function() {
				mm.onPreClick(Array.prototype.slice.call(arguments, 0));
			});

			$('#x-m-next').hover(function() {
				$(this).addClass('fc-state-hover');
			}, function() {
				$(this).removeClass('fc-state-hover');
			}).click(function() {
				mm.onNextClick(Array.prototype.slice.call(arguments, 0));
			});

			$('#x-c-today').hover(function() {
				$(this).addClass('fc-state-hover');
			}, function() {
				$(this).removeClass('fc-state-hover');
			}).click(function() {
				mm.onTodayClick(Array.prototype.slice.call(arguments, 0));
			});

			$('#x-y-pre').hover(function() {
				$(this).addClass('fc-state-hover');
			}, function() {
				$(this).removeClass('fc-state-hover');
			}).click(function() {
				mm.onPreYearClick(Array.prototype.slice.call(arguments, 0));
			});

			$('#x-y-next').hover(function() {
				$(this).addClass('fc-state-hover');
			}, function() {
				$(this).removeClass('fc-state-hover');
			}).click(function() {
				mm.onNextYearClick(Array.prototype.slice.call(arguments, 0));
			});
		},

		onPreYearClick : function() {
			this.preYear();
		},

		onNextYearClick : function() {
			this.nextYear();
		},

		onTodayClick : function() {
			var d = new Date(), m = d.getMonth() + 1, y = d.getFullYear();
			this.to(y, m);
		},

		onPreClick : function() {
			this.preMonth();
		},

		onNextClick : function() {
			this.nextMonth();
		},

		render : function() {
			this.init();
			this.initTitle();
			this.show = true;
			var thead = [], tbody = [], pagemask = [], i, len, j, cellWidth = this.cellWidth(), _cellWidth;
			pagemask.push('<div id="pagemask" style="display:none;background-color:#ffffff;z-index:1;position:absolute;width:420px;height:320px;left:47px;top:65px;text-align:center;"><div style="height:50%; margin-bottom:-50px;"></div><img src="/static/images/loading.gif"/></div>');
			thead.push('<thead><tr>');
			if (this.checkModel == 'checkbox') {
				thead.push('<th style="width:', 25, 'px;"><input type="checkbox" class="selectmore" rel="all"/></th>');
			}
			for ( i = 0, len = this.dayName.length; i < len; i++) {
				thead.push('<th class="x-col-', i, '" style="width:', cellWidth, 'px;">');
				if (this.checkModel == 'checkbox') {
					thead.push('<input type="checkbox" class="selectmore" rel="col" rev=', i, ' />');
				}
				thead.push(this.dayName[i], '</th>');
			}
			thead.push('</tr></thead>');

			tbody.push('<tbody>');
			for ( i = 0; i < 6; i++) {
				tbody.push('<tr>');
				if (this.checkModel == 'checkbox') {
					tbody.push('<td class="x-row-', i, '"><input class="selectmore" rel="row" rev=', i, ' type="checkbox" /></td>');
				}
				for ( j = 0; j < 7; j++) {
					tbody.push('<td index="', (i * 7 + j), '" class="x-row-', i, ' x-col-', j, '">', '<div style="min-height:', this.cellMinHeight, ';_height:', this.cellMinHeight, ';">', '<div class="fc-day-number"></div>', '<div class="fc-day-content"></div>', '</div>', '</td>');
				}
				tbody.push('</tr>');
			}
			tbody.push('</tbody>');

			this.el.append(['<table id="x-c-body" class="x-c-body" style="width:100%;">', thead.join(''), tbody.join(''), '</table>', pagemask.join('')].join(''));
			this.bodyCells = $('#x-c-body').find('tbody').find('td');
			this.clearSelectMore();
			this.updateCells();
			this.initEvents();
		},

		cellWidth : function() {
			var width = this.el.width();
			return Math.floor((width - 25 - 8) / 7);
		},

		initEvents : function() {
			var mm = this;
			console.log(this.bodyCells);
			this.el.click(function(e) {
				e = e.target;
				console.log(e.tagName);
				//触发元素，不是绑定元素
				if (e.tagName == 'INPUT') {//绑定多选事件
					mm.doInputClick(e);
				} else if (e.tagName == "DIV") {//绑定单选事件
					console.log("触发单击事件！");
					mm.doTbClick(e);
					console.log($(e));
				}
			});
		},
		/*
		 加入单击事件
		 */
		doTbClick : function(event) {
			var e = $(event);
			console.log(e.find(".fc-day-number").text());
			if (e.find(".fc-day-number").text() || e.filter(".fc-day-number").text()) {
				console.log(e.parents("[index]"));
				e.parents("[index]").toggleClass(this.selectedStyle);
			};
		},

		/**
		 * @desp 多选事件的回调函数
		 * @param e  触发元素，绑定事件
		 * @author ql434
		 */
		doInputClick : function(e) {

			e = $(e);
			var rel = e.attr('rel'), rev = e.attr('rev'), isChecked = e.attr("checked");
			console.log(arguments[0]);
			var y = this.y;
			var m = this.m;
			var xcell, dayno, e, selectedStyle = this.selectedStyle;
			var inputAll = $(".selectmore");
			if (rel == 'all') {
				var $sel = this.el.find("[index]");
				if (isChecked) {
					inputAll.attr("checked", true);
					$sel.each(function() {
						$(this).find(".fc-day-number").text() ? $(this).addClass(selectedStyle) : "";
					});
				} else {
					inputAll.attr("checked", false);
					$sel.each(function() {
						$(this).removeClass(selectedStyle);
					});
				};
				/*
				 this.el.find('input').attr('checked', checked).each(function() {
				 console.log(this);
				 $(this).triggerHandler('click');
				 });
				 xcell = this.el.find(".x-cell-input");*/

			} else if (rel == 'col') {
				console.log("执行选中一列操作");
				/*xcell = this.el.find('td.x-col-' + rev + ' input')*/
				xcell = this.el.find('td.x-col-' + rev);
				xcell.each(function() {
					console.log($(this));
					if (isChecked) {
						xcell.each(function() {
							$(this).find(".fc-day-number").text() ? $(this).addClass(selectedStyle) : "";
						});
					} else {
						xcell.each(function() {
							$(this).removeClass(selectedStyle);
						});
					};
					/*$(this).triggerHandler('click');*/
				});
			} else if (rel == 'row') {
				console.log("执行选中一行操作");
				xcell = this.el.find('td.x-row-' + rev).filter("[index]");
				console.log(xcell);
				if (isChecked) {
					xcell.each(function() {
						$(this).find(".fc-day-number").text() ? $(this).addClass(selectedStyle) : "";
					});
				} else {
					xcell.each(function() {
						$(this).removeClass(selectedStyle);
					});
				};
			}
			if (xcell && xcell.length > 0) {
				$.each(xcell, function(i, item) {
					e = $(this);
					if (e.attr("class") == 'x-cell-input') {
						dayno = e.data('dayno');
						if (item.checked) {
							putDateToMap(builddate(y, m, dayno));
						} else {
							removeDateFromMap(builddate(y, m, dayno));
						}
					}
				});
			}
		},

		getSelected : function() {
			return getDateArray();
			/*
			 * this.el.find('input:checked').each( function() { var e = $(this),
			 * dayno = e.data('dayno'), value = e .data('data'), obj = {}; if
			 * (dayno) { obj.d = dayno; if (value) { obj.value = value; }
			 * values.push(obj); } });
			 */
		},

		updateCells : function() {

			this.updateSelf();

			/*
			 console.log(this.url);
			 if (this.url) {
			 console.log("获取远程数据");
			 this._remoteCells();
			 } else {
			 console.log("加载本地数据！“);
			 this._updateCells();
			 }*/

		},
		_updateCells : function(data) {

			var mm = this, days = (data && data.days) ? data.days : {}, today = new Date(), tm = today.getMonth() + 1, td = today.getDate(), m = this.m, y = this.y, checkhis = data.checkhis;
			var cancheck = false;
			var selected = false;
			var allselected = false;
			var fontStyle, hoverTip;
			if ($("ul.hoverTip").length == 0) {
				hoverTip = $('<ul class="hoverTip" style="position:absolute;background:#FDFBE1"></ul>').appendTo(document.body);
			} else {
				hoverTip = $("ul.hoverTip");
			}
			this.bodyCells.each(function(index, cell) {
				cancheck = false;
				selected = false;
				cell = $(cell);
				index = cell.attr('index');
				var dayno = mm.daysValue[index], ddata = days[dayno], input, cellNumber = cell.find('div.fc-day-number').empty(), cellContent = cell.find('div.fc-day-content').empty();

				cell.removeClass('fc-today');
				if (tm == mm.m && td == dayno) {
					cell.addClass('fc-today');
				}
				cell.find('> div:first').find('input').remove();
				if (index && dayno) {
					cellNumber.text(dayno);
					input = $('<input class="x-cell-input"  type="checkbox"/>');
					input.data('dayno', dayno);
					if (dayno) {
						cancheck = checkdate(y, m, dayno, today);
					}
					if (ddata.checked == true && (cancheck || checkhis)) {
						var currentd;
						cell.find('> div:first').prepend(input);
						currentd = builddate(y, m, dayno);
						if (getDateFromMap(currentd) != null) {
							selected = true;
						}
						if (selected) {
							input.attr('checked', true);
							$.cpmLeft && ($.cpmLeft[currentd] = ddata);
						} else {
							input.attr('checked', false);
						}
						input.attr('name', currentd);
						input.data('data', ddata);

					}

				}
				selected = false;
			});
			getExceedContentBars();
		},

		/**
		 * 	@desp 渲染日期 以及加入单击事件
		 *  @author ql434
		 */
		updateSelf : function() {
			//重置
			$(".fc-day-number").empty();
			this.bodyCells.removeClass(this.selectedStyle);

			var curData = (this.data && this.data[this.y + "-" + this.m]) || this.buildData(), i = 0, $obj, tempDay;
			for (i; i < curData.length; i++) {
				tempDay = curData[i];
				if (tempDay) {
					$obj = $("[index=" + i + "]");
					tempDay.isSelected ? $obj.addClass(this.selectedStyle).find(".fc-day-number").text(tempDay.dayNo) : $obj.find(".fc-day-number").text(tempDay.dayNo);
				}
			}
		},

		updateSelf_old : function(data) {

			/*
			 逻辑判断：1：判断是否数组中是否存在当前月份的信息；
			 */

			var data = this.data[this.y + "-" + this.m];

			var cancheck = false;
			var selected = false;
			var allselected = false;
			var bodyCells = this.bodyCells;

			$(".fc-day-number").empty();
			bodyCells.removeClass(this.selectedStyle);
			//清空
			/*this.bodyCells.each*/
			var monthOb = dateUtil.getMonDetails(this.y, this.m);
			for (var i in monthOb) {
				var temp = monthOb[i];
				var f = bodyCells.filter(".x-row-" + temp[0] + ".x-col-" + temp[1]).find(".fc-day-number");
				console.log(temp);
				f.append(i);
			};

		},

		jsonReader : function(data) {
			if ( typeof data == 'string') {
				data = eval('(' + data + ')');
			}
			return data;
		},

		nextMonth : function() {
			this.buildData(true);
			var y = this.y, m = this.m;
			if (m == 12) {
				this.m = 1;
				this.y = y + 1;
			} else {
				this.m = m + 1;
			}
			this.to(this.y, this.m);
		},

		nextYear : function() {
			this.buildData(true);
			this.to(++this.y, this.m);
		},
		preMonth : function() {
			this.buildData(true);
			var y = this.y, m = this.m;
			if (m == 1) {
				this.m = 12;
				this.y = y - 1;
			} else {
				this.m = m - 1;
			}

			this.to(this.y, this.m);
		},

		preYear : function() {
			this.buildData(true);
			this.to(--this.y, this.m);
		},

		setTime : function(y, m) {
			this.y = y;
			this.m = m;
		},

		setYear : function(y) {
			this.y = y;
		},

		setMonth : function(m) {
			this.m = m;
		},

		to : function(y, m) {

			if (!this.bodyCells || this.bodyCells.length == 0) {
				return;
			}
			this.y = y;
			this.m = m;
			this.updateTitle();
			this.calcDays();
			this.clearSelectMore();
			this.updateCells();
			this.sysShow();
		},
		updateTitle : function() {
			this.titleField.text(this.y + '  年  ' + this.monthName[this.m]);
		},

		getYear : function() {
			return this.y;
		},
		getMonth : function() {
			return this.m;
		},
		setUnchecked : function() {
			this.el.find(':checkbox').attr("checked", false);
		},
		isShow : function() {
			return this.show;
		},
		changeBookPackageId : function(packageId) {
			this.bookPackageId = packageId;
		},
		//触发显示
		sysShow : function() {
			var value = this.getSelectedIM();
			var id = this.showElmID;
			console.log("触发显示：" + id);
			if ($("#" + id) && $("#"+id)[0].tagName == "INPUT") {
				$("#" + id).val(value);
			};
		},
		//保存当前月份并输出选中日期（string）
		getSelected : function() {
			var data = this.data, i, len, j, tempString, output = [];
			for (i in data) {
				len = data[i].length;
				for (j in data[i]) {
					console.log(data[i][j].isSelected);
					if (data[i][j].isSelected) {
						tempString = i + "-" + data[i][j].dayNo;
						output.push(tempString);
					}
				}
			}
			if (output.length > 1) {
				output.sort(function(a, b) {
					var aArr = a.split("-"), bArr = b.split("-");
					for (var i = 1; i < aArr.length; i++) {
						aArr[i] = aArr[i].length === 1 ? 0 + aArr[i] : aArr[i];
						bArr[i] = bArr[i].length === 1 ? 0 + bArr[i] : bArr[i];
					};
					if (parseInt(aArr.join("")) > bArr.join("")) {
						return 1;
					} else if (parseInt(aArr.join("")) > bArr.join("")) {
						return -1;
					} else {
						return 0;
					}

				});
			};

			return output.join();
		},
		getSelectedIM : function() {
			this.buildData(true);
			return this.getSelected();
		}
	};
	function checkdate(y, m, d) {
		var today = new Date();
		var tmpdate;
		var tmpds;
		var td = today.getDate() - 1;
		today.setDate(td);
		tmpds = builddate(y, m, d, "/");
		tmpdate = new Date(tmpds);
		return today < tmpdate;
	}

})(window, jQuery);

function removeDateFromMap(date) {
	if (cacheDayMap != null) {
		cacheDayMap.remove(date);
	}
}

function getDateFromMap(date) {
	if (cacheDayMap != null) {
		return cacheDayMap.get(date);
	}
}

function getDateArray() {
	if (cacheDayMap != null) {
		return cacheDayMap.toArray();
	}
}

function clearDateMap() {
	if (cacheDayMap != null) {
		cacheDayMap.clear();
	}
}

function putDateToMap(date) {
	if (cacheDayMap != null) {
		cacheDayMap.put(date, date);
	}
}

function cacheday(date, flag) {
	if (flag) {
		putDateToMap(date);
	} else {
		removeDateFromMap(date);
	}
}
