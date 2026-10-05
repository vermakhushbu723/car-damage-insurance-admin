import React from 'react';
import { Switch } from 'antd';

/** The design's labelled toggle ("Off | On" pill) -- antd Switch with text children. */
const OnOffSwitch = ({ checked, onChange, disabled, ariaLabel }) => (
    <Switch
        size="small"
        className="onoff-switch"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        checkedChildren="On"
        unCheckedChildren="Off"
        aria-label={ariaLabel}
    />
);

export default OnOffSwitch;
