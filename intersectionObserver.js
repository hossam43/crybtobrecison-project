// Before applaying
/* 
  - applay the sections class in the html
  - applay the style for the html elemet
  - create the hidden class in css
  - put the dom nodelist in an array
  - create the option with the correct order
*/

// REVEAL One Direction

export const ob = function (allNodeLists, classToRemove, optionsList) {
  const IntersectionObserverCB = (entries, observer) => {
    const [entry] = entries;
    if (!entry.isIntersecting) return;
    entry.target.classList.remove(classToRemove);
    console.log(classToRemove);
    observer.unobserve(entry.target);
  };

  allNodeLists.forEach((nodeList, index) => {
    const elementObserver = new IntersectionObserver(
      IntersectionObserverCB,
      optionsList[index]
    );
    if (nodeList.length > 0) {
      nodeList.forEach((node) => {
        elementObserver.observe(node);
        node.classList.add(classToRemove);
      });
    } else {
      elementObserver.observe(nodeList);
      nodeList.classList.add(classToRemove);
    }
  });
};
