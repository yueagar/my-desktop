"use strict"

class App {
	constructor() {
		this.Helper = new Helper();
		this.TextureHandler = new TextureHandler();
		this.TextHandler = new TextHandler();
		this.MouseTrailHandler = new MouseTrailHandler();
		this.StageHandler = new StageHandler(this.Helper, this.TextureHandler, this.TextHandler, this.MouseTrailHandler);
	};
	initialize() {
		this.TextureHandler.load();
		this.StageHandler.start();
	};
};

class Helper {
	constructor() {
		this.weekdays = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
		this.lessonsData = null;
		this.TodayLessons = [];
		this.deadlinesData = null;
		this.weatherData1 = null;
		this.warningData = null;
		this.debug = false;
	};
	fetchData() {
		fetch("lessons.json").then(response => response.json()).then(response => {
			this.lessonsData = response;
			this.getTodayLessons();
		});
		fetch("deadlines.json").then(response => response.json()).then(response => {
			this.deadlinesData = response;
		});
		
		const weatherQuery = new XMLHttpRequest();
		weatherQuery.open("GET", "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en");
		weatherQuery.send();
		weatherQuery.onreadystatechange = () => {
			if (weatherQuery.readyState == 4) {
				this.weatherData = JSON.parse(weatherQuery.responseText);
			};
		};
		const warningQuery = new XMLHttpRequest();
		warningQuery.open("GET", "https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=warnsum&lang=en");
		warningQuery.send();
		warningQuery.onreadystatechange = () => {
			if (warningQuery.readyState == 4) {
				this.warningData = Object.entries(JSON.parse(warningQuery.responseText));
			};
		};
	};
	updateDate() {
		this.dateObj = new Date();
	};
	getFormattedDate() {
		const Year = this.dateObj.getFullYear();
		const Month = this.ToTwoDigits(this.dateObj.getMonth() + 1);
		const Day = this.ToTwoDigits(this.dateObj.getDate());
		const Weekday = this.weekdays[this.dateObj.getDay()];
		
		const Hour = this.ToTwoDigits(this.dateObj.getHours());
		const Minute = this.ToTwoDigits(this.dateObj.getMinutes());
		const Second = this.ToTwoDigits(this.dateObj.getSeconds());
		
		return `${Year}-${Month}-${Day} (${Weekday}) ${Hour}:${Minute}:${Second}`;
	};
	ToTwoDigits(num) {
		return num < 10 ? "0" + num : num;
	};
	getNextLesson() {
		if (!this.lessonsData) return "Loading...";
		
		let text = false;
		
		this.TodayLessons.forEach(lesson => {
			if (this.dateObj.getHours() < lesson.hour || (this.dateObj.getHours() == lesson.hour && this.dateObj.getMinutes() <= lesson.minute) || this.debug) {
			text = `次の授業は${lesson.courseCode}です。\n${lesson.courseName}です。\n${lesson.type}です。\n${this.ToTwoDigits(lesson.hour)}:${this.ToTwoDigits(lesson.minute)}に${lesson.venue}で始まります。\n`;
			};
		});
		
		if (!text) text = `今日の授業は全部終わりました。`;
		
		return text;
	};
	getTodayLessons() {
		if (!this.lessonsData) return "Loading...";
		
		this.TodayLessons = [];
		this.lessonsData.forEach(course => {
			course.lessons.forEach(lesson => {
				lesson.weekday == (this.debug ? 2 : this.dateObj.getDay()) && lesson.active && this.TodayLessons.push({
					"courseCode": course.courseCode,
					"courseName": course.courseName,
					"type": lesson.type,
					"day": lesson.weekday,
					"hour": lesson.hour,
					"minute": lesson.minute,
					"length": lesson.length,
					"venue": lesson.venue,
				});
			});
		});
		this.TodayLessons.sort((a, b) => b.hour - a.hour);
	};
	getDeadlines() {
		if (!this.deadlinesData) return "Loading...";
		
		let text = false;
		
		this.deadlinesData.forEach(deadline => {
			if (this.dateObj.getTime() < new Date(`${deadline.year}-${deadline.month + 1}-${deadline.day} 23:59`)) {
				if (!text) text = `締め切り：\n`;
				text += `${deadline.year}-${this.ToTwoDigits(deadline.month + 1)}-${this.ToTwoDigits(deadline.day)}: ${deadline.name}\n`;
			};
		});
		
		if (!text) text = `締め切りはありませんよ。`;
		
		return text;
	};
	getWeatherInfo() {
		if (!this.weatherData) return "Loading...";
		
		let ShatinData = {
			"temperature": null, 
			"rainfall": null
		};
		this.weatherData.temperature.data.forEach(entry => {
			entry.place == "Sha Tin" && (ShatinData.temperature = entry.value + "°" + entry.unit);
		});
		this.weatherData.rainfall.data.forEach(entry => {
			entry.place == "Sha Tin" && (ShatinData.rainfall = entry.max + entry.unit);
		});
		return `今沙田の気温は${ShatinData.temperature}です。\n降水は${ShatinData.rainfall}です。`;
	};
	getWarningInfo() {
		if (!this.warningData) return [];
		
		let warnings = [];
		this.debug && warnings.push("TC10", "WRAINB", "WTS", "WL", "WFNTSA", "WTMW");
		this.warningData.forEach(warning => warning[1].actionCode != "CANCEL" && warnings.push(warning[1].code));
		
		return warnings;
	};
};

class TextureHandler {
	constructor() {
		this.FallbackTexture = PIXI.Texture.WHITE;
		this.textures = new Map();
	};
	load() {
		this.get("LycorisLogo", "textures/LycorisLogo.png");
		this.get("ChisaTaki", "textures/ChisaTaki.png");
		this.get("trail", "textures/trail.png");
		this.get("star", "textures/star.png");
		this.get("TC1", "textures/TC1.gif");
		this.get("TC3", "textures/TC3.gif");
		this.get("TC8NE", "textures/TC8NE.gif");
		this.get("TC8NW", "textures/TC8NW.gif");
		this.get("TC8SE", "textures/TC8SE.gif");
		this.get("TC8SW", "textures/TC8SW.gif");
		this.get("TC9", "textures/TC9.gif");
		this.get("TC10", "textures/TC10.gif");
		this.get("WCOLD", "textures/WCOLD.gif");
		this.get("WFIRER", "textures/WFIREY.gif");
		this.get("WFIREY", "textures/WFIREY.gif");
		this.get("WFNTSA", "textures/WFNTSA.gif");
		this.get("WFROST", "textures/WFROST.gif");
		this.get("WHOT", "textures/WHOT.gif");
		this.get("WL", "textures/WL.gif");
		this.get("WMSGNL", "textures/WMSGNL.gif");
		this.get("WRAINA", "textures/WRAINA.gif");
		this.get("WRAINB", "textures/WRAINB.gif");
		this.get("WRAINR", "textures/WRAINR.gif");
		this.get("WTMW", "textures/WTMW.gif");
		this.get("WTS", "textures/WTS.gif");
	};
	get(id, url) {
		let added;
		return this.textures.get(id) || (added = PIXI.Texture.from(url), this.textures.set(id, added), added);
	};
	del(id) {
		let removed = this.textures.get(id);
		removed.destroy();
		this.textures.delete(id);
		return removed.destroyed;
	};
};

class TextHandler {
	constructor() {
		this.texts = new Map();
	};
	get(id) {
		let added;
		return this.texts.get(id) || (added = new PIXI.Text(), this.texts.set(id, added), added);
	};
	del(id) {
		let removed = this.texts.get(id);
		removed.destroy();
		this.texts.delete(id);
		return removed.destroyed;
	};
};

class StageHandler {
	constructor(Helper, TextureHandler, TextHandler, MouseTrailHandler) {
		this.App = new PIXI.Application({
			background: "#000000",
			resizeTo: window,
			antialias: true
		});
		this.Helper = Helper;
		this.TextureHandler = TextureHandler;
		this.TextHandler = TextHandler;
		this.MouseTrailHandler = MouseTrailHandler;
		this.root = new PIXI.Container();
		this.Ticker = new PIXI.Ticker();
		this.width = 1920;
		this.height = 1080;
		this.mouse = {
			x: 0,
			y: 0
		};
		this.starParticles = [];
		this.starCount = 64;
		this.starRotation = 0;
		this.ropeHueCounter = 0;
		this.frame = 0;
		this.fps = 0;
		this.time = 0;
		this.frameTime = 0;
		this.fetchTime = 0;
	};
	start() {
		document.body.appendChild(this.App.view);
		this.Ticker.add(delta => {
			this.render(delta);
		});
		this.time = this.frameTime = this.fetchTime = Date.now();
		this.Helper.fetchData();
		for (let i = 0; i < this.starCount; i++) {
			this.starParticles.push({
				x: ~~(this.width * Math.random()),
				y: ~~(-this.height * Math.random()),
				size: 0.75 + ~~(Math.random() * 1.25 * 10000) / 10000,
				dirX: Math.random() > 0.5 ? -1 : 1,
				velX: ~~(Math.random() * 10000) / 20000,
				velY: 0.5 + ~~(Math.random() * 1.5 * 10000) / 10000,
				rotationSpeed: 0.75 + ~~(Math.random() * 1.25 * 10000) / 10000
			});
		};
		this.graphics = new PIXI.Graphics();
		this.rope = new PIXI.SimpleRope(this.TextureHandler.get("trail"), this.MouseTrailHandler.points);
		this.rope.blendmode = PIXI.BLEND_MODES.ADD;
		this.ropeRainbowFilter = new PIXI.ColorMatrixFilter();
		this.rope.tint = "#ff0000";
		this.rope.filters = [this.ropeRainbowFilter];
		this.App.stage.addChild(this.root, this.graphics, this.rope);
		this.App.stage.eventMode = "static";
		this.App.stage.hitArea = this.App.screen;
		this.App.stage.on("mousemove", event => {
			this.ropeHueCounter -= Math.sqrt((event.global.x - this.mouse.x) * (event.global.x - this.mouse.x) + (event.global.y - this.mouse.y) * (event.global.y - this.mouse.y)) / 2;
			if (this.ropeHueCounter < 0) this.ropeHueCounter = 360;
			this.mouse.x = event.global.x;
			this.mouse.y = event.global.y;
		});
		this.App.stage.on("mousedown", event => {
			this.MouseTrailHandler.clicks.push({
				x: event.global.x,
				y: event.global.y,
				width: this.width,
				height: this.height,
				time: this.time,
				hueCount: this.ropeHueCounter
			});
		});
		this.Ticker.start();
	};
	render(delta) {
		this.Helper.updateDate();
		this.time = Date.now();
		this.frame++;
		this.time - this.frameTime >= 1000 && (this.fps = this.frame, this.frame = 0, this.frameTime = this.time);
		this.time - this.fetchTime >= 60000 && (this.Helper.fetchData(), this.fetchTime = this.time);
		
		this.starRotation += 0.02;
		
		this.ropeRainbowFilter.hue(this.ropeHueCounter);
		
		this.graphics.clear();
		this.root.removeChildren();
		
		this.drawLycorisLogo();
		this.drawStars(delta);
		this.drawChisaTaki();
		//this.drawWelcome();
		this.drawWeather();
		this.drawWarnings();
		this.drawLessons();
		this.drawDeadlines();
		this.drawStats();
		this.drawMouseClicks();
		this.drawMouseTrail();
		
		this.root.scale.set(window.innerWidth / this.width, window.innerHeight / this.height);
	};
	drawLycorisLogo() {
		const LycorisLogoSprite = new PIXI.Sprite(this.TextureHandler.get("LycorisLogo"));
		
		LycorisLogoSprite.anchor.set(.5, .5);
		LycorisLogoSprite.position.set(this.width / 2, this.height / 2 - this.TextHandler.get("StatsText").height);
		LycorisLogoSprite.scale.set(2, 2);
		LycorisLogoSprite.tint = "#111111";
		
		this.root.addChild(LycorisLogoSprite);
	};
	drawStars(delta) {
		this.starParticles.forEach(star => {
			star.x += star.dirX * star.velX;
			star.y += star.velY;
			
			if (star.y > this.height) {
				star.x = ~~(this.width * Math.random());
				star.y = ~~(-this.height * Math.random());
				star.size = 0.75 + ~~(Math.random() * 1.25 * 10000) / 10000;
				star.dirX = Math.random() > 0.5 ? -1 : 1;
				star.velX = ~~(Math.random() * 10000) / 20000;
				star.velY = 0.5 + ~~(Math.random() * 1.5 * 10000) / 10000;
				star.rotationSpeed = 0.75 + ~~(Math.random() * 1.25 * 10000) / 10000;
			};
			
			const starSprite = new PIXI.Sprite(this.TextureHandler.get("star"));
			
			starSprite.texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON;
			starSprite.anchor.set(.5, .5);
			starSprite.scale.set(.05 * star.size, .05 * star.size);
			starSprite.position.set(star.x, star.y);
			starSprite.rotation = star.rotationSpeed * star.dirX * this.starRotation;
			
			this.root.addChild(starSprite);
		});
	};
	drawChisaTaki() {
		const ChisaTakiSprite = new PIXI.Sprite(this.TextureHandler.get("ChisaTaki"));
		
		ChisaTakiSprite.texture.baseTexture.mipmap = PIXI.MIPMAP_MODES.ON;
		ChisaTakiSprite.anchor.set(.5, .5);
		ChisaTakiSprite.position.set(this.width / 2, this.height / 2 - this.TextHandler.get("StatsText").height);
		ChisaTakiSprite.scale.set(.4, .4);
		
		this.root.addChild(ChisaTakiSprite);
	};
	drawWelcome() {
		const WelcomeText = this.TextHandler.get("WelcomeText");
		
		WelcomeText.text = `ようこそ`;
		WelcomeText.fontFamily = "sans-serif";
		WelcomeText.style.align = "center";
		WelcomeText.style.fill = 0xffffff;
		WelcomeText.style.fontSize = "300px";
		WelcomeText.anchor.set(.5, .5);
		WelcomeText.position.set(this.width / 2, this.height / 2);
		
		this.root.addChild(WelcomeText);
	};
	drawWeather() {
		const WeatherText = this.TextHandler.get("WeatherText");
		
		WeatherText.text = this.Helper.getWeatherInfo();
		WeatherText.fontFamily = "sans-serif";
		WeatherText.style.align = "right";
		WeatherText.style.fill = 0xffffff;
		WeatherText.style.fontSize = "30px";
		WeatherText.anchor.set(1, 0);
		WeatherText.position.set(this.width, this.TextHandler.get("DeadlinesText").y - WeatherText.height);
		
		this.root.addChild(WeatherText);
	};
	drawWarnings() {
		const warnings = this.Helper.getWarningInfo();
		
		for (let i = 0; i < warnings.length; i++) {
			const warningSprite = new PIXI.Sprite(this.TextureHandler.get(warnings[i]));
			
			warningSprite.anchor.set(1, 0);
			warningSprite.position.set(this.width - 20 - 60 * i, this.TextHandler.get("WeatherText").y - 60);
			
			this.root.addChild(warningSprite);
		};
	};
	drawLessons() {
		const nextLessonText = this.TextHandler.get("nextLessonText");
		
		nextLessonText.text = this.Helper.getNextLesson();
		nextLessonText.fontFamily = "sans-serif";
		nextLessonText.style.align = "left";
		nextLessonText.style.fill = 0xffffff;
		nextLessonText.style.fontSize = "30px";
		nextLessonText.anchor.set(0, 0);
		nextLessonText.position.set(this.width / 2 - 280 - nextLessonText.width, this.height / 2);
		
		this.root.addChild(nextLessonText);
	};
	drawDeadlines() {
		const DeadlinesText = this.TextHandler.get("DeadlinesText");
		
		DeadlinesText.text = this.Helper.getDeadlines();
		DeadlinesText.fontFamily = "sans-serif";
		DeadlinesText.style.align = "left";
		DeadlinesText.style.fill = 0xffffff;
		DeadlinesText.style.fontSize = "30px";
		DeadlinesText.anchor.set(1, 0);
		DeadlinesText.position.set(this.width, this.height / 2 - 60);
		
		this.root.addChild(DeadlinesText);
	};
	drawStats() {
		const StatsText = this.TextHandler.get("StatsText");
		
		StatsText.text = `${this.Helper.getFormattedDate()} | FPS: ${this.fps}`;
		StatsText.fontFamily = "sans-serif";
		StatsText.style.align = "center";
		StatsText.style.fill = 0xffffff;
		StatsText.style.fontSize = "30px";
		StatsText.anchor.set(.5, 1);
		StatsText.position.set(this.width / 2, this.height - 40);
		
		this.root.addChild(StatsText);
	};
	drawMouseClicks() {
		this.graphics.beginFill(0, 0);
		
		this.MouseTrailHandler.clicks.forEach(click => {
			if (this.time - click.time > 4000) this.MouseTrailHandler.clicks.shift();
			this.graphics.lineStyle(4, 0xffffff, 1 - (this.time - click.time) / 4000);
			this.graphics.moveTo(click.x, click.y);
			this.graphics.drawCircle(click.x, click.y, ~~((this.time - click.time) / 4 * click.width / this.width));
		});
		
		this.graphics.endFill();
		this.graphics.lineStyle(0);
	};
	drawMouseTrail() {
		this.MouseTrailHandler.historyX.pop();
		this.MouseTrailHandler.historyX.unshift(this.mouse.x);
		this.MouseTrailHandler.historyY.pop();
		this.MouseTrailHandler.historyY.unshift(this.mouse.y);
		for (let i = 0; i < this.MouseTrailHandler.ropeSize; i++) {
			this.MouseTrailHandler.points[i].x = this.MouseTrailHandler.cubicInterpolation(this.MouseTrailHandler.historyX, i / this.MouseTrailHandler.ropeSize * this.MouseTrailHandler.historySize);
			this.MouseTrailHandler.points[i].y = this.MouseTrailHandler.cubicInterpolation(this.MouseTrailHandler.historyY, i / this.MouseTrailHandler.ropeSize * this.MouseTrailHandler.historySize);
		};
	};
};

class MouseTrailHandler {
	constructor() {
		this.historyX = [];
		this.historyY = [];
		this.historySize = 20;
		this.ropeSize = 100;
		this.points = [];
		this.clicks = [];
		this.ready();
	};
	ready() {
		for (let i = 0; i < this.historySize; i++) {
			this.historyX.push(0);
			this.historyY.push(0);
		}
		for (let i = 0; i < this.ropeSize; i++) {
			this.points.push(new PIXI.Point(0, 0));
		}
	};
	// Beginning of the external code of "Cubic interpolation based on https://github.com/osuushi/Smooth.js"
	clipInput(k, arr) {
		if (k < 0) k = 0;
		if (k > arr.length - 1) k = arr.length - 1;

		return arr[k];
	};
	getTangent(k, factor, array) {
		return factor * (this.clipInput(k + 1, array) - this.clipInput(k - 1, array)) / 2;
	};
	cubicInterpolation(array, t, tangentFactor) {
		if (!tangentFactor) tangentFactor = 1;

		const k = Math.floor(t);
		const m = [this.getTangent(k, tangentFactor, array), this.getTangent(k + 1, tangentFactor, array)];
		const p = [this.clipInput(k, array), this.clipInput(k + 1, array)];

		t -= k;
		const t2 = t * t;
		const t3 = t * t2;

		return (2 * t3 - 3 * t2 + 1) * p[0] + (t3 - 2 * t2 + t) * m[0] + (-2 * t3 + 3 * t2) * p[1] + (t3 - t2) * m[1];
	};
	// End of the external code
}

const DesktopApp = new App();
window.DesktopApp = DesktopApp;
DesktopApp.initialize();