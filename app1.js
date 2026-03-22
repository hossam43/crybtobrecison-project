import { ob } from "./intersectionObserver.js";

///////////////////////////////////////////////////////////
// // Set current year
// const yearEl = document.querySelector(".year");
// const currentYear = new Date().getFullYear();
// yearEl.textContent = currentYear;

///////////////////////////////////////////////////////////
// Make mobile navigation work

//Click: btn-mobile-nav

//Add: nav-open

//ON: .header

const btnNavEl = document.querySelector(".btn-mobile-nav");
const headerEl = document.querySelector(".header");

btnNavEl.addEventListener("click", () => {
  headerEl.classList.toggle("nav-open");
});

/////////////////////////////////////////
// Stick navigation

const sectionHeroEl = document.querySelector(".hero-section");
const obs = new IntersectionObserver(
  function (entries) {
    const ent = entries[0];
    // console.log(ent);
    if (ent.isIntersecting === false) {
      document.body.classList.add("sticky");
    }
    if (ent.isIntersecting === true) {
      document.body.classList.remove("sticky");
    }
  },
  {
    // in the viewport
    root: null,
    threshold: 0,
    rootMargin: "-80px",
  }
);
obs.observe(sectionHeroEl);
/////////////////////////////////////////
const allSection = document.querySelectorAll(".section-reveal");
const optionList = {
  root: null,
  threshold: 0.1,
};

ob(allSection, "element--hidden", optionList);

// The Event Delegation
// Before you applay the a href must be the same as the section id
const smoothScrollNav = (parentClass, childrenClass) => {
  document.querySelector(`.${parentClass}`).addEventListener("click", (e) => {
    e.preventDefault();
    const id = e.target.getAttribute("href");
    // Matching
    if (e.target.classList.contains(childrenClass)) {
      document.querySelector(id).scrollIntoView({ behavior: "smooth" });
    }
  });
};

smoothScrollNav("main-nav-list", "main-nav-link");
