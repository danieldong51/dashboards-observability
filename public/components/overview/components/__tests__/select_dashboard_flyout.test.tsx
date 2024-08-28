/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
import { Props } from '../select_dashboard_flyout';
import React from 'react';
import { SelectDashboardFlyout } from '../select_dashboard_flyout';

configure({ adapter: new Adapter() });

const mountSelectDashboardFlyout = (props: Partial<Props> = {}) => {
  const defaultProps: Props = {
    closeFlyout: () => {},
    wrapper: { dashboardSelected: false },
    dashboards: {},
    registerDashboard: () => {},
  };

  return mount(<SelectDashboardFlyout {...defaultProps} {...props} />);
};

describe('Select dashboard flyout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render', () => {
    const wrapper = mountSelectDashboardFlyout();
    expect(wrapper).toMatchSnapshot();
  });

  it('should change heading when dashboard is selected', () => {
    const wrapper = mountSelectDashboardFlyout({ wrapper: { dashboardSelected: true } });
    expect(wrapper).toMatchSnapshot();
  });

  it('should close when user clicks cancel', () => {
    const mockCloseFlyout = jest.fn();
    const wrapper = mountSelectDashboardFlyout({ closeFlyout: mockCloseFlyout });

    (wrapper.find('EuiFlyout').prop('onClose') as () => void)();
    wrapper.find('EuiSmallButtonEmpty').simulate('click');

    expect(mockCloseFlyout).toHaveBeenCalledTimes(2);
  });
});