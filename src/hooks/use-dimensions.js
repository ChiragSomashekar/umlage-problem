import { useEffect, useLayoutEffect, useState } from "react";

// The course's measuring hook (Module 5): size of a ref'd container,
// re-measured on window resize. Resize becomes a state change → the
// whole UI = f(state) machinery handles the rest.
export const useDimensions = (targetRef) => {
  const getDimensions = () => ({
    width: targetRef.current ? targetRef.current.offsetWidth : 0,
    height: targetRef.current ? targetRef.current.offsetHeight : 0,
  });

  const [dimensions, setDimensions] = useState(getDimensions);

  const handleResize = () => setDimensions(getDimensions());

  useEffect(() => {
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useLayoutEffect(() => {
    handleResize();
  }, []);

  return dimensions;
};
