/**
 * Create an animation for transactions
 *
 * @param elementSrc Location pointing to the image to animate
 */
export function createCoinWithAnimation(elementSrc: string) {
  const arCoin = document.createElement("img"),
    pos = { x: 0, y: 0 },
    id = `ar-coin-animation-${document.querySelectorAll(".ar-coing-animation").length}`;
  let visibility = 100;

  arCoin.setAttribute("src", elementSrc);
  arCoin.setAttribute("alt", "a");
  arCoin.style.position = "fixed";
  arCoin.style.bottom = "0";
  arCoin.style.right = `${Math.floor(Math.random() * 30)}px`;
  arCoin.style.width = "18px";
  arCoin.style.zIndex = "1000000";
  arCoin.style.transition = "all .23s ease";
  arCoin.id = id;
  arCoin.classList.add("ar-coing-animation");
  document.body.appendChild(arCoin);

  // @ts-ignore
  const animation = setInterval(() => {
    if (visibility < 0) {
      document.querySelector(`#${id}`)?.remove();
      return clearInterval(animation);
    }

    visibility -= 6.5;
    pos.x += Math.floor(Math.random() * 30) - 10;
    pos.y += Math.floor(Math.random() * 24);
    arCoin.style.transform = `translate(-${pos.x}px, -${pos.y}px)`;
    arCoin.style.opacity = `${visibility / 100}`;
  }, 100);
}
