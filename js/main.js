// Choose a working area before importing the city graph or fetching geographic data.
const zone = new URLSearchParams(location.search).get('zone');
if (['rennrat', 'herytstory', 'city'].includes(zone)) {
  import('./city-main.js').catch(error => {
    console.error(error);
    document.getElementById('loading-status').textContent = `Chargement interrompu : ${error.message}`;
  });
} else {
  const loader = document.querySelector('.loader');
  loader.classList.add('studio-start');
  loader.innerHTML = `<span class="mta-bullet loader-bullet">NY</span>
    <div class="loader-title">New York · Studio</div>
    <p>Choisissez votre lieu de tournage</p>
    <a href="?zone=rennrat"><strong>Rennrat · Projet 32</strong><span>Clinton Gardens · Maisons, école, centre médical, commissariat</span></a>
    <a href="?zone=herytstory"><strong>Herytstory · Projet 41</strong><span>East Village Gardens · Maisons, café et réception</span></a>
    <a href="?zone=city"><strong>Ville complète</strong><span>Les deux quartiers dans Manhattan · Chargement plus important</span></a>
    <small>Les modes quartier construisent uniquement les environs et limitent le trafic. Les intérieurs apparaissent à proximité.</small>`;
}
