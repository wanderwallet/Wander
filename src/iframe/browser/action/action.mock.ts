export const action = {
  // This mock exists jus in case we call this by mistake in Embed but, in general, any code that calls `action.setIcon`
  // should only do it for BE and have some other behavior implemented for Embed.
  setIcon: (options: any) => {}
};
