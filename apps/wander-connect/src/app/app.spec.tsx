import { render } from '@testing-library/react';

import { WanderConnectAppRoot } from './app';

describe('App', () => {
  it('should render successfully', () => {
    const { baseElement } = render(
      <WanderConnectAppRoot />
    );
    expect(baseElement).toBeTruthy();
  });

  it('should have a greeting as the title', () => {
    const { getAllByText } = render(
      <WanderConnectAppRoot />
    );
    expect(
      getAllByText(new RegExp('Welcome @org/wander-connect', 'gi')).length > 0
    ).toBeTruthy();
  });
});
