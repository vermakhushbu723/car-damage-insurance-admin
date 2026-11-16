import React from 'react';
import { AutoComplete, Form, Select } from 'antd';
import { INDIA_STATES, citiesOf } from '../../data/indiaLocations';

const STATE_OPTIONS = INDIA_STATES.map((s) => ({ label: s, value: s }));

/** All States / UTs. `cityName`: the City field of the same address, cleared when the state changes. */
export function StateSelect({ value, onChange, cityName, placeholder = 'Select State', ...rest }) {
    const form = Form.useFormInstance();
    return (
        <Select
            {...rest}
            value={value || undefined}
            options={STATE_OPTIONS}
            placeholder={placeholder}
            showSearch={{ optionFilterProp: 'label' }}
            allowClear
            onChange={(next) => {
                if (cityName && next !== value) form?.setFieldValue(cityName, undefined);
                onChange?.(next);
            }}
        />
    );
}

/** Cities of the state in field `stateName`; a city not in the list can still be typed. */
export function CityInput({ value, onChange, stateName, placeholder, ...rest }) {
    const form = Form.useFormInstance();
    const state = Form.useWatch(stateName, form);
    const typed = String(value ?? '').toLowerCase();
    const options = citiesOf(state).filter((c) => !typed || c.toLowerCase().includes(typed)).map((c) => ({ value: c }));
    return (
        <AutoComplete
            {...rest}
            value={value || undefined}
            options={options}
            allowClear
            placeholder={state ? placeholder || 'Select or type city' : 'Select State first'}
            onChange={onChange}
        />
    );
}

/** Pincode typed by hand: digits only, max 6 (use with `normalize={pinNormalize}`). */
export const pinNormalize = (v) => String(v ?? '').replace(/\D/g, '').slice(0, 6);
