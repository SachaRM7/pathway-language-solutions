// Program pages: "See a sample" buttons of the "Included in this program"
// section open one page of the document in a dialog (no download).
const dialog = document.getElementById('doc-sample');
if (dialog) {
  const image = dialog.querySelector('img');
  const title = dialog.querySelector('#doc-sample-title');
  document.querySelectorAll('[data-sample]').forEach(button => button.addEventListener('click', () => {
    image.src = button.dataset.sample;
    image.alt = button.dataset.title;
    title.textContent = button.dataset.title;
    dialog.showModal();
  }));
  dialog.addEventListener('click', event => {
    // A click on the backdrop or on the close button closes the dialog.
    if (event.target === dialog || event.target.closest('[data-close]')) dialog.close();
  });
  dialog.addEventListener('contextmenu', event => { if (event.target === image) event.preventDefault(); });
}
