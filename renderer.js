// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.


const footer = document.querySelector("#footer");
const scrollDisable = document.querySelector("#scroll-disable");

const NAME = 0;
const TYPE = 1;

const removeAllChildNodes = (parent) => {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}
var scrollInterval = null;

var directoryModel = {
  left:{
    model: '',
    selectors: {
      btnUp: document.querySelector("#btn-up-left"),
      btnSort:document.querySelector("#btn-sort-left"),
      sortType:document.querySelector("#sort-type-left"),
      path: document.querySelector(".path-left"),
      list: document.querySelector("#left-list")
    }
  },
  right: {
    model:'',
    selectors: {
      btnUp: document.querySelector("#btn-up-right"),
      btnSort:document.querySelector("#btn-sort-right"),
      sortType:document.querySelector("#sort-type-right"),
      path: document.querySelector(".path-right"),
      list: document.querySelector("#right-list")
    }
  }
};

class Directory {
  constructor(dir, path, sortBy=NAME) {
    this.dir = dir;
    this.path = path;
    this.sortBy = sortBy;
  }

  // get dir ()  { return this._dir; };
  // get path () { return this._path; };
  // get sortBy () { return this._sortBy; };
  // set dir (value) { this._dir = value};
  // set path (value) { this._path = value };
  // set sortBy (value) { this._sortBy = value };

 }

function bindList(dm) {

    const { model, selectors } = dm;
    selectors.path.textContent = model.path;
    selectors.sortType.textContent = (model.sortBy == NAME)? 'type' : 'name';

    removeAllChildNodes(selectors.list);

    for (let file of model.dir) {

      let li = document.createElement('li');
      let span = document.createElement(('span'));

      if (file.isDirectory) {
        span.className = " directory";
      }

      li.appendChild(span);
      span = document.createElement(('span'));
      span.textContent = file.name;
      li.appendChild(span);
      selectors.list.appendChild(li);
    }
}

async function bindLists(dirPath, dm=null, both = true) {

  try {
    const dir = await window.electronAPI.getDirectory(dirPath);
    if (both) {
      directoryModel.left.model = new Directory(dir.dir, dir.dirPath);
      directoryModel.right.model = new Directory(dir.dir, dir.dirPath);
      bindList(directoryModel.left);
      bindList(directoryModel.right);
    } else {
      dm.model = new Directory(dir.dir, dir.dirPath);
      bindList(dm);
    }
  } catch (e) {
    console.log(e);
  }

}

async function bindFooter() {

  try {
    let pics = await window.electronAPI.getPics();
    pics.slice(0, 30).forEach((pic) => {
      const img = document.createElement('img');
      img.alt=pic.id;
      img.src = pic["download_url"];

      footer.appendChild(img);
    });
  } catch (e) {
    console.log(e);
  }

}

function startAutoScroll() {

  const footerScrollWidth = footer.scrollWidth;


  function isElementInViewport (el) {

    const rect = el.getBoundingClientRect();
    return rect.right > 0;
  }

  scrollInterval = self.setInterval(() => {

    const first = document.querySelector('#footer img');

    if(!isElementInViewport(first)){
      footer.appendChild(first);
      footer.scrollTo(footer.scrollLeft - first.offsetWidth, 0);
    }
    if (footer.scrollLeft !== footerScrollWidth) {
      footer.scrollTo(footer.scrollLeft + 1, 0);
    }
  }, 25);

  return scrollInterval;
}

function setScrollDisable() {
  scrollDisable.textContent =  (scrollInterval) ? 'Stop' : 'Scroll';
}

async function handleUp(dm) {
  let dirPath = dm.selectors.path.textContent;
  let index = dirPath.lastIndexOf('\/');

  try {
    if (index > 0) {
      dirPath = dirPath.slice(0, index);
      await bindLists(dirPath, dm, false);
    } else {
      await bindLists();
    }
  } catch (e) {
    console.log(e);
  }
}

async function handleSort(dm) {
  const {model} = dm;
  if (model.sortBy == NAME) {
    model.dir.sort( (a,b) => {
      if (b.isDirectory) return 1;
      else {
        if (a.isDirectory) return -1;
        else return 0;
      }
    });
    model.sortBy = TYPE;
  } else {
    model.dir.sort((a,b) => {
      if (a.name > b.name) return 1;
      else {
        if (b.name > a.name) return -1;
        else return 0;
      }
    });
    model.sortBy = NAME;
  }

  bindList(dm);
}


window.addEventListener('DOMContentLoaded', async () => {

  // document.getElementById('drag').ondragstart = (event) => {
  //   event.preventDefault();
  //   window.electronAPI.startDrag('drag-and-drop.md');
  // };

  // Main
  await bindLists();

  // Footer
  await bindFooter();

  // Auto scroll
  startAutoScroll();
  setScrollDisable();

  scrollDisable.addEventListener('click', () => {

      if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
      } else {
        startAutoScroll();
      }
      setScrollDisable();
  });

  directoryModel.left.selectors.btnUp.addEventListener('click' , async () => {
    await handleUp(directoryModel.left);
  });

  directoryModel.left.selectors.btnSort.addEventListener('click' , async () => {
    await handleSort(directoryModel.left);
  });

  directoryModel.right.selectors.btnUp.addEventListener('click' , async () => {
    await handleUp(directoryModel.right);
  });

  directoryModel.right.selectors.btnSort.addEventListener('click' , async () => {
    await handleSort(directoryModel.right);
  });

});

window.addEventListener('beforeunload', _event => {
  clearInterval(scrollInterval);
});
