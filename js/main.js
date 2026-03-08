/* =============================
   SEARCH FUNCTION
============================= */

function searchFunction() {

	let input = document.getElementById("searchInput");
	if (!input) return;

	let filter = input.value.toLowerCase();
	let products = document.getElementsByClassName("products");

	for (let i = 0; i < products.length; i++) {

		let text = products[i].textContent.toLowerCase();

		if (text.includes(filter)) {
			products[i].style.display = "";
		} else {
			products[i].style.display = "none";
		}

	}
}


/* =============================
   MENU TOGGLE
============================= */

function toggleMenu() {

	let menu = document.getElementById("sideMenu");

	if (menu) {
		menu.classList.add("active");
	}

}

function closeMenu() {

	let menu = document.getElementById("sideMenu");

	if (menu) {
		menu.classList.remove("active");
	}

}


/* =============================
   GLIGHTBOX
============================= */

if (typeof GLightbox !== "undefined") {

	const lightbox = GLightbox({
		touchNavigation: true,
		loop: true
	});

}


/* =============================
   HEADER SLIDER
============================= */

const slides = document.querySelectorAll(".featured-slide");
const dots = document.querySelectorAll(".dot");

let index = 0;
let headerSlider;

function showSlides() {

	if (!slides.length) return;

	slides.forEach(slide => slide.classList.remove("active"));
	dots.forEach(dot => dot.classList.remove("active"));

	index++;

	if (index >= slides.length) {
		index = 0;
	}

	slides[index].classList.add("active");

	if (dots[index]) {
		dots[index].classList.add("active");
	}

}


function goToSlide(n) {

	if (!slides.length) return;

	slides.forEach(slide => slide.classList.remove("active"));
	dots.forEach(dot => dot.classList.remove("active"));

	index = n;

	slides[index].classList.add("active");

	if (dots[index]) {
		dots[index].classList.add("active");
	}

}


function nextSlide() {
	showSlides();
}


function prevSlide() {

	if (!slides.length) return;

	slides.forEach(slide => slide.classList.remove("active"));
	dots.forEach(dot => dot.classList.remove("active"));

	index--;

	if (index < 0) {
		index = slides.length - 1;
	}

	slides[index].classList.add("active");

	if (dots[index]) {
		dots[index].classList.add("active");
	}

}


if (slides.length) {
	headerSlider = setInterval(showSlides, 7000);
}


/* =============================
   HEADER SWIPE
============================= */

const slider = document.querySelector(".featured-product");

if (slider) {

	let startX = 0;

	slider.addEventListener("touchstart", function(e) {

		startX = e.touches[0].clientX;

	});

	slider.addEventListener("touchend", function(e) {

		let endX = e.changedTouches[0].clientX;

		if (startX - endX > 50) {
			showSlides();
		}

		if (endX - startX > 50) {

			index -= 2;

			if (index < -1) {
				index = slides.length - 2;
			}

			showSlides();

		}

	});

}


/* =============================
   PAUSE HEADER SLIDER
============================= */

const headerContainer = document.querySelector(".featured-product");

if (headerContainer) {

	headerContainer.addEventListener("mouseenter", function() {
		clearInterval(headerSlider);
	});

	headerContainer.addEventListener("mouseleave", function() {
		headerSlider = setInterval(showSlides, 5000);
	});

}


/* =============================
   FOOTER SLIDER
============================= */

const footerSlides = document.querySelectorAll(".featured-slide-footer");
const footerDots = document.querySelectorAll(".footer-dot");

let footerIndex = 0;
let footerSliderInterval;

function showFooterSlides() {

	if (!footerSlides.length) return;

	footerSlides.forEach(slide => slide.classList.remove("active"));
	footerDots.forEach(dot => dot.classList.remove("active"));

	footerIndex++;

	if (footerIndex >= footerSlides.length) {
		footerIndex = 0;
	}

	footerSlides[footerIndex].classList.add("active");

	if (footerDots[footerIndex]) {
		footerDots[footerIndex].classList.add("active");
	}

}


function nextFooterSlide() {
	showFooterSlides();
}


function prevFooterSlide() {

	if (!footerSlides.length) return;

	footerSlides.forEach(slide => slide.classList.remove("active"));
	footerDots.forEach(dot => dot.classList.remove("active"));

	footerIndex--;

	if (footerIndex < 0) {
		footerIndex = footerSlides.length - 1;
	}

	footerSlides[footerIndex].classList.add("active");

	if (footerDots[footerIndex]) {
		footerDots[footerIndex].classList.add("active");
	}

}


if (footerSlides.length) {
	footerSliderInterval = setInterval(showFooterSlides, 10000);
}


/* =============================
   FOOTER SWIPE
============================= */

const footerSlider = document.querySelector(".featured-product-footer-slider");

if (footerSlider) {

	let footerStartX = 0;

	footerSlider.addEventListener("touchstart", function(e) {

		footerStartX = e.touches[0].clientX;

	});

	footerSlider.addEventListener("touchend", function(e) {

		let footerEndX = e.changedTouches[0].clientX;

		if (footerStartX - footerEndX > 50) {
			showFooterSlides();
		}

		if (footerEndX - footerStartX > 50) {

			footerIndex -= 2;

			if (footerIndex < -1) {
				footerIndex = footerSlides.length - 2;
			}

			showFooterSlides();

		}

	});

}


/* =============================
   PAUSE FOOTER SLIDER
============================= */

const footerContainer = document.querySelector(".featured-product-footer-slider");

if (footerContainer) {

	footerContainer.addEventListener("mouseenter", function() {
		clearInterval(footerSliderInterval);
	});

	footerContainer.addEventListener("mouseleave", function() {
		footerSliderInterval = setInterval(showFooterSlides, 5000);
	});

}