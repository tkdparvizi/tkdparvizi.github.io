
    window.addEventListener("load",()=>{document.getElementById("preloader").classList.add("hidden")}),document.getElementById("year").textContent=(new Date).getFullYear();const nav=document.getElementById("siteNav"),toTop=document.getElementById("toTop"),callBtn=document.getElementById("callBtn");window.addEventListener("scroll",()=>{const e=window.scrollY;nav.classList.toggle("scrolled",e>40);},{passive:!0}),toTop.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));const observer=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&e.target.classList.add("in")})},{threshold:.15});document.querySelectorAll(".reveal").forEach(e=>observer.observe(e));const beltRow=document.getElementById("beltRow"),beltFill=document.getElementById("beltFill"),beltObserver=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(beltRow.classList.add("in"),beltFill.style.width="100%",beltObserver.unobserve(e.target))})},{threshold:.3});beltObserver.observe(beltRow);const counters=document.querySelectorAll("[data-count]"),counterObserver=new IntersectionObserver(e=>{e.forEach(e=>{if(e.isIntersecting){const t=e.target,s=parseInt(t.dataset.count,10),o=1500,l=performance.now(),a=e=>{const n=Math.min((e-l)/o,1),r=1-Math.pow(1-n,3);t.textContent=Math.floor(r*s),n<1?requestAnimationFrame(a):t.textContent=s};requestAnimationFrame(a),counterObserver.unobserve(t)}})},{threshold:.5});counters.forEach(e=>counterObserver.observe(e));

    // ===== Improved Mobile Menu =====
    const burgerBtn = document.getElementById('burgerBtn');
    const navLinks = document.getElementById('navLinks');
    const header = document.getElementById('siteNav');

    function toggleMenu() {
      navLinks.classList.toggle('mobile-open');
      burgerBtn.classList.toggle('active');
    }

    function closeMenu() {
      navLinks.classList.remove('mobile-open');
      burgerBtn.classList.remove('active');
    }

    burgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });

    // Close menu when clicking on a link inside
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        closeMenu();
      });
    });

    // Close menu when clicking outside of it and outside the burger
    document.addEventListener('click', (e) => {
      const isClickInsideNav = navLinks.contains(e.target);
      const isClickInsideBurger = burgerBtn.contains(e.target);
      if (!isClickInsideNav && !isClickInsideBurger && navLinks.classList.contains('mobile-open')) {
        closeMenu();
      }
    });

    // Close menu on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('mobile-open')) {
        closeMenu();
      }
    });

    // Optional: close menu on scroll (if you want)
    // window.addEventListener('scroll', closeMenu, { passive: true });

    // Gallery data
    const galleryData=[
      
    {type:"image",src:"./assets/images/4.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/5.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/6.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/7.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/8.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/9.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/10.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/11.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/12.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/13.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/14.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/15.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/16.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/17.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/18.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/19.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/20.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/21.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/22.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/23.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/24.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/25.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/26.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/27.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/28.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/29.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/30.jpg?v=1",alt:"تمرین تکواندو"},
    {type:"image",src:"./assets/images/31.jpg?v=1",alt:"تمرین تکواندو"},

    ],galleryGrid=document.getElementById("galleryGrid");galleryData.forEach((e,t)=>{const s=document.createElement("div");if(s.className="gallery-item",s.dataset.index=t,"image"===e.type){const t=document.createElement("img");t.src=e.src,t.alt=e.alt,t.loading="lazy",s.appendChild(t)}else if("video"===e.type){const t=document.createElement("video");t.src=e.src,t.muted=!0,t.loop=!0,t.playsInline=!0,t.setAttribute("preload","metadata");const o=document.createElement("div");o.className="play-icon",o.textContent="▶",s.appendChild(t),s.appendChild(o),s.addEventListener("mouseenter",()=>t.play().catch(()=>{})),s.addEventListener("mouseleave",()=>{t.pause(),t.currentTime=0})}s.addEventListener("click",()=>{const t=document.getElementById("lightbox"),s=document.getElementById("lightboxImg");s.src=e.src,s.alt=e.alt,t.classList.add("open")}),galleryGrid.appendChild(s)});const lightbox=document.getElementById("lightbox"),lightboxClose=document.getElementById("lightboxClose"),lightboxImg=document.getElementById("lightboxImg");lightboxClose.addEventListener("click",()=>lightbox.classList.remove("open")),lightbox.addEventListener("click",e=>{e.target===lightbox&&lightbox.classList.remove("open")}),document.addEventListener("keydown",e=>{"Escape"===e.key&&lightbox.classList.remove("open")});
  