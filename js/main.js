(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Neural-network / data-stream background ---------- */
  const canvas = $('#bg');
  const ctx = canvas.getContext('2d');
  let W, H, DPR, nodes = [];
  const mouse = { x: -9999, y: -9999 };
  const HEX = '01ABCDEF<>{}/\\#$%';

  function resize() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = canvas.width = innerWidth * DPR;
    H = canvas.height = innerHeight * DPR;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    const count = Math.min(110, Math.floor((innerWidth * innerHeight) / 16000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - .5) * .35 * DPR, vy: (Math.random() - .5) * .35 * DPR,
      r: (Math.random() * 1.6 + .8) * DPR,
      hue: Math.random() < .25 ? 265 : 185
    }));
  }
  addEventListener('resize', resize);
  addEventListener('pointermove', e => { mouse.x = e.clientX * DPR; mouse.y = e.clientY * DPR; });
  addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });

  // falling code columns
  const colW = 22;
  let drops = [];
  function initDrops() { drops = Array.from({ length: Math.ceil(innerWidth / colW) }, () => Math.random() * -50); }
  initDrops(); addEventListener('resize', initDrops);

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // matrix rain (very subtle)
    ctx.font = `${12 * DPR}px JetBrains Mono, monospace`;
    for (let i = 0; i < drops.length; i++) {
      if (i % 3) continue;
      const y = drops[i] * 16 * DPR;
      ctx.fillStyle = 'rgba(0,240,255,.10)';
      ctx.fillText(HEX[(Math.random() * HEX.length) | 0], i * colW * DPR, y);
      drops[i] += .18;
      if (y > H && Math.random() > .975) drops[i] = Math.random() * -20;
    }

    // network
    const maxD = 150 * DPR;
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx; a.y += a.vy;
      if (a.x < 0 || a.x > W) a.vx *= -1;
      if (a.y < 0 || a.y > H) a.vy *= -1;
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (dm < 180 * DPR) { a.x += (a.x - mouse.x) / dm * .6; a.y += (a.y - mouse.y) / dm * .6; }
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < maxD) {
          ctx.strokeStyle = `hsla(${a.hue},100%,60%,${(1 - d / maxD) * .22})`;
          ctx.lineWidth = DPR * .8;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      if (dm < 220 * DPR) {
        ctx.strokeStyle = `rgba(0,240,255,${(1 - dm / (220 * DPR)) * .5})`;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
      ctx.fillStyle = `hsla(${a.hue},100%,65%,.85)`;
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, 6.283); ctx.fill();
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  resize(); draw();

  /* ---------- Optional hero video (assets/hero.mp4) ---------- */
  const vid = $('#heroVideo');
  fetch('assets/hero.mp4', { method: 'HEAD' }).then(r => {
    if (!r.ok) return;
    vid.src = 'assets/hero.mp4';
    vid.addEventListener('canplay', () => { vid.classList.add('on'); vid.play().catch(() => {}); }, { once: true });
  }).catch(() => {});

  /* ---------- Typed roles ---------- */
  const roles = ['Penetration Tester', 'VAPT Analyst', 'Web & Mobile Security Specialist', 'Vulnerability Management Analyst', 'Ethical Hacker'];
  const typedEl = $('#typed');
  if (reduce) typedEl.textContent = roles[0];
  else {
    let ri = 0, ci = 0, del = false;
    (function tick() {
      const word = roles[ri];
      typedEl.textContent = word.slice(0, del ? --ci : ++ci);
      let t = del ? 35 : 75;
      if (!del && ci === word.length) { del = true; t = 1500; }
      else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; t = 350; }
      setTimeout(tick, t);
    })();
  }

  /* periodic glitch on the name */
  const g = $('.glitch');
  if (!reduce) setInterval(() => { g.classList.add('auto'); setTimeout(() => g.classList.remove('auto'), 400); }, 4500);

  /* ---------- Nav ---------- */
  const nav = $('#nav'), toggle = $('#navToggle'), links = $('#navLinks');
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  $$('a', links).forEach(a => a.addEventListener('click', () => {
    links.classList.remove('open'); toggle.setAttribute('aria-expanded', false);
  }));
  const progress = $('#progress');
  addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', scrollY > 20);
    const h = document.documentElement.scrollHeight - innerHeight;
    progress.style.width = (scrollY / h * 100) + '%';
  }, { passive: true });

  const sections = $$('main section[id]');
  const spy = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) $$('a', links).forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(s => spy.observe(s));

  /* ---------- Reveal + counters ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    $$('[data-count]', e.target).forEach(count);
    io.unobserve(e.target);
  }), { threshold: .12 });
  $$('.reveal').forEach((el, i) => { el.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(el); });

  function count(el) {
    const end = parseFloat(el.dataset.count), dec = +el.dataset.dec || 0, suf = el.dataset.suffix || '';
    const t0 = performance.now(), dur = 1400;
    (function step(t) {
      const p = Math.min((t - t0) / dur, 1), v = end * (1 - Math.pow(1 - p, 3));
      el.textContent = v.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + (p === 1 ? suf : '');
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- Card tilt + spotlight ---------- */
  $$('.card, .work').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left, y = e.clientY - r.top;
      el.style.setProperty('--mx', x + 'px'); el.style.setProperty('--my', y + 'px');
      if (el.classList.contains('tilt') && !reduce && el.classList.contains('in')) {
        el.style.transition = 'border-color .3s, box-shadow .3s';
        el.style.transform = `perspective(800px) rotateX(${(.5 - y / r.height) * 6}deg) rotateY(${(x / r.width - .5) * 8}deg) translateY(-4px)`;
      }
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- Interactive terminal ---------- */
  const body = $('#termBody'), form = $('#termForm'), input = $('#termCmd');
  const history = []; let hi = 0;
  const out = (html) => { body.insertAdjacentHTML('beforeend', html + '\n'); body.scrollTop = body.scrollHeight; };
  const cmds = {
    help: () => `<span class="c">Available commands</span>
  whoami       who am I
  skills       my security toolkit
  experience   where I've worked
  certs        certifications &amp; education
  contact      how to reach me
  resume       download my resume
  clear        clear the screen`,
    whoami: () => `<span class="p">Hari Prasath J</span>: Penetration Tester | VAPT &amp; Vulnerability Management Analyst
3.5+ years securing web &amp; mobile applications. Chennai, India.`,
    skills: () => `<span class="c">[web]</span>     Burp Suite Pro, OWASP ZAP, SQLmap, Nikto, Acunetix, Postman
<span class="c">[mobile]</span>  MobSF, APKTool, JADX, Frida, Drozer, ADB
<span class="c">[vuln]</span>    Qualys, Tenable (Nessus), Rapid7 InsightVM
<span class="c">[network]</span> Nmap, Metasploit, Wireshark, Kali, Hydra, Hashcat
<span class="c">[auto]</span>    Ansible, Python, PowerShell
<span class="c">[blue]</span>    Splunk, Wazuh, MITRE ATT&amp;CK, Cyber Kill Chain`,
    experience: () => `<span class="p">2026 → now</span>   Application Security Tester, Primus Global Technologies
<span class="p">2025 → 2026</span>  Security Analyst – VAPT, CREK ODR LLP
<span class="p">2022 → 2024</span>  Security Analyst, NPai Pvt Ltd`,
    certs: () => `TryHackMe: Pre Security
Master Diploma: Cyber Security &amp; Ethical Hacking, BIA Institute (2026)
B.Sc Computer Science, Vivekananda College (2022)`,
    contact: () => `email   <a class="c" href="mailto:hariprasathj1705@gmail.com">hariprasathj1705@gmail.com</a>
phone   +91 63748 39323
linkedin <a class="c" href="https://www.linkedin.com/in/hari-prasath-j-b476a01ba" target="_blank" rel="noopener">/in/hari-prasath-j-b476a01ba</a>`,
    resume: () => { setTimeout(() => { const a = document.createElement('a'); a.href = 'Hari_Prasath_New_Resume.pdf'; a.download = ''; a.click(); }, 300); return '<span class="m">Starting download…</span>'; },
    ls: () => 'about.txt  skills.json  experience.log  resume.pdf  <span class="m">flag.txt</span>',
    'cat flag.txt': () => '<span class="p">FLAG{y0u_f0und_the_h1dd3n_fl4g}</span>  Nice. Now hire me 😉',
    sudo: () => '<span class="e">hari is not in the sudoers file. This incident will be reported.</span>'
  };
  cmds['sudo su'] = cmds.sudo;

  out('<span class="m">Welcome. Type </span><span class="c">help</span><span class="m"> to begin.</span>');

  form.addEventListener('submit', e => {
    e.preventDefault();
    const raw = input.value.trim(); input.value = '';
    if (!raw) return;
    history.push(raw); hi = history.length;
    out(`<span class="p">hari@kali:~$</span> ${raw.replace(/</g, '&lt;')}`);
    const key = raw.toLowerCase();
    if (key === 'clear') { body.innerHTML = ''; return; }
    const fn = cmds[key] || cmds[key.split(' ')[0] === 'sudo' ? 'sudo' : key];
    out(fn ? fn() : `<span class="e">command not found:</span> ${raw.replace(/</g, '&lt;')}. Try <span class="c">help</span>`);
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp' && hi > 0) { input.value = history[--hi]; e.preventDefault(); }
    if (e.key === 'ArrowDown') { input.value = history[++hi] || ''; if (hi > history.length) hi = history.length; e.preventDefault(); }
  });
  $('#term').addEventListener('click', () => input.focus({ preventScroll: true }));
})();
