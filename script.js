// ---------- Constants ----------
const h = 4.136e-15;   // Planck's constant in eV·s
const PLATE_X = 120;   // x position of the metal plate (emitter)
const COLLECTOR_X = 520; // x position of the collector

// ---------- Get the HTML elements ----------
const freqSlider = document.getElementById("freq");
const intSlider = document.getElementById("intensity");
const wfSlider = document.getElementById("wf");
const metalSelect = document.getElementById("metal");
const canvas = document.getElementById("lab");
const ctx = canvas.getContext("2d");
ctx.scale(2, 2); // canvas is 1280x600 for sharpness, but we draw as if it is 640x300

// ---------- Current values (updated from the sliders) ----------
let frequency = 10e14;  // Hz
let intensity = 50;     // percent
let workFunction = 2.3; // eV

let photons = [];   // light particles moving toward the plate
let electrons = []; // electrons emitted from the plate

// ---------- Physics ----------
function photonEnergy() {
	return h * frequency; // E = h f  (eV)
}
function maxKineticEnergy() {
	return Math.max(0, photonEnergy() - workFunction); // KE = hf - work function
}
function thresholdFrequency() {
	return workFunction / h; // f0 = work function / h
}
function emitsElectrons() {
	return photonEnergy() >= workFunction;
}

// ---------- Light colour from frequency ----------
function lightColor() {
	const f = frequency / 1e14;
	if (f < 4) return "#a03030";   // infrared (not visible, shown dark red)
	if (f > 7.5) return "#b388ff"; // ultraviolet (not visible, shown violet)
	const hue = (f - 4) / 3.5 * 270; // red (0) to violet (270)
	return "hsl(" + hue + ", 100%, 55%)";
}
function lightName() {
	const f = frequency / 1e14;
	if (f < 4) return "Infrared (invisible)";
	if (f > 7.5) return "Ultraviolet (invisible)";
	return "Visible light";
}

// ---------- Read sliders and update the text ----------
function readControls() {
	frequency = freqSlider.value * 1e14;
	intensity = Number(intSlider.value);
	workFunction = Number(wfSlider.value);

	document.getElementById("freqText").textContent = freqSlider.value + " × 10¹⁴ Hz";
	document.getElementById("intText").textContent = intensity + " %";
	document.getElementById("wfText").textContent = workFunction.toFixed(2) + " eV";
	document.getElementById("lightType").textContent = lightName();

	document.getElementById("outE").textContent = photonEnergy().toFixed(2) + " eV";
	document.getElementById("outF0").textContent = (thresholdFrequency() / 1e14).toFixed(2) + " × 10¹⁴ Hz";
	document.getElementById("outKE").textContent = maxKineticEnergy().toFixed(2) + " eV";
	document.getElementById("outV0").textContent = maxKineticEnergy().toFixed(2) + " V";
	document.getElementById("outI").textContent = emitsElectrons() ? intensity + " %" : "0 %";

	const status = document.getElementById("status");
	if (emitsElectrons()) {
		status.textContent = "Electrons are emitted: photon energy is greater than the work function.";
		status.classList.add("emitting");
	} else {
		status.textContent = "No electrons: photon energy is less than the work function.";
		status.classList.remove("emitting");
	}
}

// When a slider moves, update everything
freqSlider.addEventListener("input", readControls);
intSlider.addEventListener("input", readControls);
wfSlider.addEventListener("input", function () {
	metalSelect.value = ""; // back to "Custom"
	readControls();
});
metalSelect.addEventListener("change", function () {
	if (metalSelect.value !== "") {
		wfSlider.value = metalSelect.value;
		readControls();
	}
});

// ---------- Animation ----------
function update() {
	let simSpeed = document.getElementById("simSpeed").value / 100;
	document.getElementById("simSpeedText").textContent = simSpeed;

	// Higher intensity = more photons per frame
	if (Math.random() < intensity / 100 * 0.4 * simSpeed) {
		photons.push({ x: 0, y: 70 + Math.random() * 160 });
	}

	// Move photons; when one hits the plate, maybe release an electron
	for (const p of photons) p.x += 4 * simSpeed;
	for (const p of photons) {
		if (p.x >= PLATE_X && emitsElectrons()) {
			// More kinetic energy = faster electron
			const speed = 2 + 2 * Math.sqrt(maxKineticEnergy());
			electrons.push({ x: PLATE_X, y: p.y, vx: speed, vy: (Math.random() - 0.5) });
		}
	}
	photons = photons.filter(p => p.x < PLATE_X);

	// Move electrons; remove them when they reach the collector
	for (const e of electrons) {
		e.x += e.vx * simSpeed;
		e.y += e.vy * simSpeed;
	}
	electrons = electrons.filter(e => e.x < COLLECTOR_X && e.y > 30 && e.y < 270);
}

function draw() {
	ctx.clearRect(0, 0, 640, 300);

	// Metal plate and collector
	ctx.fillStyle = "#b0b7c3";
	ctx.fillRect(PLATE_X, 50, 14, 200);
	ctx.fillRect(COLLECTOR_X, 50, 14, 200);
	ctx.fillStyle = "white";
	ctx.font = "14px sans-serif";
	ctx.fillText("Metal plate", PLATE_X - 30, 40);
	ctx.fillText("Collector", COLLECTOR_X - 22, 40);

	// Photons
	for (const p of photons) {
		ctx.beginPath();
		ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
		ctx.lineWidth = 4;
		ctx.strokeStyle = lightColor();
		ctx.stroke();
		ctx.fillStyle = "#f7ec4f";
		ctx.fill();
	}

	// Electrons
	ctx.lineWidth = 1;
	ctx.strokeStyle = "#4fc3f7";
	for (const e of electrons) {
		ctx.beginPath();
		ctx.arc(e.x, e.y, 4, 0, Math.PI * 2);
		ctx.stroke();
	}
	ctx.fillStyle = "white";
	ctx.fillText("(blue dots are electrons)", 240, 290);
}

function loop() {
	update();
	draw();
	requestAnimationFrame(loop);
}

readControls();
loop();
