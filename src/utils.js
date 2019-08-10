export const removeAllChildren = (element) => {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
};

export const chunk = (coll, size) => {
  const iter = (iterColl, acc = []) => {
    if (iterColl.length === 0) {
      return acc;
    }
    return iter(
      iterColl.slice(size),
      [...acc, iterColl.slice(0, size)],
    );
  };

  return iter(coll);
};
