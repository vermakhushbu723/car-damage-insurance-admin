import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Input, Select, DatePicker, Checkbox, Button, Modal, InputNumber, Switch, App, Tooltip } from 'antd';
import {
    PlusSquareOutlined, CloudUploadOutlined, MobileOutlined, LayoutOutlined, CheckCircleFilled, ReloadOutlined, DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import {
    ACCOUNT_TYPES, DEPARTMENTS, ACCOUNT_STATUSES, ZONES, ZONE_STATES, COUNTRIES, PLATFORMS, STATES, SHIFTS, LANGUAGES,
    SKILL_TAGS, HANDLER_DESIGNATIONS, ROLE_LEVEL_HINT, roleFormName, roleFormTitle,
} from '../../data/roles';
import { useCollection, useLogChange, useRoles } from '../../store/AdminStore';
import { organizationName } from '../../auth/session';
import { api } from '../../api/client';
import { generatePassword } from '../../utils/format';

const MOBILE_RE = /^(\+91[\s-]?)?[6-9]\d{9}$/;
const PIN_RE = /^\d{6}$/;
const MAX_IMAGE_BYTES = 1024 * 1024;
const ZONE_REAL = ZONES.filter((z) => z !== 'Pan India');

const Section = ({ title, extra, children }) => (
    <section className="rounded-lg p-3 md:p-4" style={{ background: '#fff', border: `1px solid ${COLORS.border}` }}>
        {title && (
            <div className="flex flex-wrap items-center gap-3 mb-2.5">
                <h2 className="text-[15px] font-bold m-0" style={{ color: COLORS.primary }}>{title}</h2>
                {extra}
            </div>
        )}
        {children}
    </section>
);

const Grid = ({ children }) => <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 max-w-[760px]">{children}</div>;

const requiredMark = (label, { required }) => (
    <span className="font-semibold text-[12px]" style={{ color: COLORS.textPrimary }}>
        {label}{required && <span style={{ color: COLORS.danger }}> *</span>}
    </span>
);

const req = (msg) => [{ required: true, message: msg }];

/** Profile image picker -- JPG/PNG, max 1 MB, min 100x100 px. Value is a data URL. */
const ImageUpload = ({ value, onChange }) => {
    const inputRef = useRef(null);
    const { message } = App.useApp();

    const pick = (e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (!['image/jpeg', 'image/png'].includes(file.type)) return message.error('Only JPG or PNG images are allowed.');
        if (file.size > MAX_IMAGE_BYTES) return message.error('Image must be 1 MB or smaller.');
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                if (img.width < 100 || img.height < 100) return message.error('Image must be at least 100 x 100 px.');
                onChange?.(reader.result);
            };
            img.src = reader.result;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div className="flex items-center gap-3 rounded-md px-2.5 py-1.5" style={{ border: `1.5px dashed ${COLORS.primary}`, background: COLORS.bgField, minHeight: 46 }}>
            <input ref={inputRef} type="file" accept="image/png,image/jpeg" style={{ display: 'none' }} onChange={pick} />
            {value
                ? <img src={value} alt="Profile" className="rounded-md object-cover" style={{ width: 32, height: 32 }} />
                : <span className="flex items-center justify-center rounded-md" style={{ width: 32, height: 32, background: COLORS.primarySoft, color: COLORS.primary, fontSize: 16 }}><CloudUploadOutlined /></span>}
            <button type="button" className="text-left flex-1 min-w-0" onClick={() => inputRef.current?.click()}>
                <span className="block text-[12.5px] font-bold" style={{ color: COLORS.primary }}>{value ? 'Change File' : 'Choose File'}</span>
                <span className="block text-[10px] font-medium">JPG/PNG, Max, 1 MB Min 100*100 PX</span>
            </button>
            {value && <Tooltip title="Remove"><Button type="text" size="small" icon={<DeleteOutlined />} onClick={() => onChange?.(null)} /></Tooltip>}
        </div>
    );
};

/** Mobile / Web / Both cards. */
const PlatformPicker = ({ value, onChange }) => {
    const icons = {
        mobile: <MobileOutlined style={{ color: COLORS.primary }} />,
        web: <LayoutOutlined style={{ color: '#12894A' }} />,
        both: <span className="flex gap-0.5"><MobileOutlined style={{ color: '#F59E0B' }} /><LayoutOutlined style={{ color: '#F59E0B' }} /></span>,
    };
    return (
        <div className="flex gap-2">
            {PLATFORMS.map((p) => {
                const on = value === p.key;
                return (
                    <button key={p.key} type="button" onClick={() => onChange?.(p.key)} className="flex flex-col items-center gap-1">
                        <span className="relative flex items-center justify-center rounded-md" style={{ width: 46, height: 52, fontSize: 19, background: '#F1F1F1', border: `1px solid ${on ? COLORS.primary : '#D9D9D9'}`, boxShadow: on ? `0 0 0 1px ${COLORS.primary}` : 'none' }}>
                            {icons[p.key]}
                            <span className="absolute top-1 right-1 flex items-center justify-center rounded-full" style={{ width: 11, height: 11, border: `1px solid ${on ? COLORS.primary : '#555'}`, fontSize: 11, color: COLORS.primary, background: '#fff' }}>
                                {on && <CheckCircleFilled />}
                            </span>
                        </span>
                        <span className="text-[11px]">{p.label}</span>
                    </button>
                );
            })}
        </div>
    );
};

/** Zone checkboxes -- "Pan India" ticks every zone. */
const ZonePicker = ({ value = [], onChange }) => {
    const toggle = (zone, checked) => {
        if (zone === 'Pan India') return onChange?.(checked ? [...ZONES] : []);
        let next = checked ? [...value, zone] : value.filter((z) => z !== zone && z !== 'Pan India');
        if (ZONE_REAL.every((z) => next.includes(z)) && !next.includes('Pan India')) next = [...next, 'Pan India'];
        onChange?.(next);
    };
    return (
        <div className="flex flex-wrap gap-x-2 gap-y-1 py-1">
            {ZONES.map((z) => <Checkbox key={z} checked={value.includes(z)} onChange={(e) => toggle(z, e.target.checked)}>{z}</Checkbox>)}
        </div>
    );
};

const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

/** Turns the stored user into form values (dates -> dayjs). */
const userToForm = (u) => ({
    ...u,
    dateOfJoining: u.dateOfJoining ? dayjs(u.dateOfJoining) : null,
    effectiveFrom: u.effectiveFrom ? dayjs(u.effectiveFrom) : null,
    extra: u.extra ?? {},
});

const blankForm = (roleKey) => ({
    accountType: 'Internal',
    roleKey,
    country: 'India',
    zones: [],
    platform: 'web',
    status: 'Active',
    tempPassword: generatePassword(),
    extra: { surveyorAccess: false, workshopAccess: false, languages: [], skills: [], statesCovered: [] },
});

const CreateUserPage = () => {
    const navigate = useNavigate();
    const [params, setParams] = useSearchParams();
    const { message, modal } = App.useApp();
    const [form] = Form.useForm();
    const { items: users, add, update } = useCollection('users');
    const { items: branches } = useCollection('branches');
    const roles = useRoles();
    const logChange = useLogChange();

    const [editingId, setEditingId] = useState(null);
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickedUser, setPickedUser] = useState(null);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [roleForm] = Form.useForm();

    const roleKey = Form.useWatch('roleKey', form);
    const accountType = Form.useWatch('accountType', form);
    const watchedZones = Form.useWatch('zones', form);
    const role = roles.byKey[roleKey];
    const editing = users.find((u) => u.id === editingId);

    // ?role=claim-handler preselects a role (Roles & Permissions "Add User");
    // ?edit=USR-0001 opens a user for modification.
    // Lists come without profile images; the single-user read has it.
    const loadForEdit = async (id) => {
        try {
            const full = await api.get(`/users/${encodeURIComponent(id)}`);
            setEditingId(full.id);
            form.resetFields();
            form.setFieldsValue(userToForm(full));
            return full;
        } catch (err) {
            message.error(err.message);
            return null;
        }
    };

    useEffect(() => {
        const editId = params.get('edit');
        const target = editId && users.find((u) => u.id === editId);
        if (target) {
            loadForEdit(target.id);
        } else {
            form.setFieldsValue(blankForm(params.get('role') && roles.byKey[params.get('role')] ? params.get('role') : undefined));
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Agent code is auto-generated for call-center agents.
    useEffect(() => {
        if (role?.extra === 'call-center' && !form.getFieldValue(['extra', 'agentCode'])) {
            const used = new Set(users.map((u) => u.extra?.agentCode));
            let n = 1001;
            while (used.has(`CC-${n}`)) n += 1;
            form.setFieldValue(['extra', 'agentCode'], `CC-${n}`);
        }
    }, [role, form, users]);

    const zoneStates = useMemo(() => {
        const zones = watchedZones ?? [];
        const picked = zones.filter((z) => z !== 'Pan India');
        if (!picked.length || zones.includes('Pan India')) return STATES;
        return STATES.filter((s) => picked.some((z) => ZONE_STATES[z]?.includes(s)));
    }, [watchedZones]);

    const managerOptions = useMemo(() => {
        const level = role?.level ?? 99;
        const list = users
            .filter((u) => u.status === 'Active' && u.id !== editingId && (roles.byKey[u.roleKey]?.level ?? 99) < level)
            .map((u) => ({ value: u.id, label: `${u.name} — ${roles.byKey[u.roleKey]?.name ?? u.roleKey}` }));
        return [{ value: 'ADMIN', label: 'Admin (Insurer Admin)' }, ...list];
    }, [users, role, roles.byKey, editingId]);

    const roleOptions = roles.list.map((r) => ({ value: r.key, label: roleFormName(r) }));

    const resetToNew = (keepRole) => {
        setEditingId(null);
        form.resetFields();
        form.setFieldsValue(blankForm(keepRole));
        setParams({}, { replace: true });
    };

    const suggestUserId = () => {
        const name = (form.getFieldValue('name') ?? '').trim();
        if (!name || form.getFieldValue('userId')) return;
        const [first, last = ''] = name.toLowerCase().split(/\s+/);
        let candidate = `${first}${last ? `.${last[0]}` : ''}`.replace(/[^a-z.]/g, '');
        let n = 1;
        const taken = new Set(users.map((u) => u.userId.toLowerCase()));
        while (taken.has(candidate)) candidate = `${first}.${last[0] ?? 'u'}${n++}`;
        form.setFieldValue('userId', candidate);
    };

    const unique = (field, label) => ({
        validator: (_, value) => {
            const v = String(value ?? '').trim().toLowerCase();
            if (v && users.some((u) => u.id !== editingId && String(u[field] ?? '').toLowerCase() === v)) return Promise.reject(new Error(`${label} already exists`));
            return Promise.resolve();
        },
    });

    const [saving, setSaving] = useState(false);

    const submit = async (values) => {
        const branch = branches.find((b) => b.id === values.extra?.branchId);
        const organization = branch?.organization ?? (values.accountType === 'Internal' ? organizationName() : (editing?.organization ?? 'External Partner'));
        const record = {
            ...values,
            name: values.name.trim(),
            userId: values.userId.trim(),
            email: values.email.trim(),
            organization,
            dateOfJoining: values.dateOfJoining?.format('YYYY-MM-DD') ?? null,
            effectiveFrom: values.effectiveFrom?.format('YYYY-MM-DD') ?? null,
            extra: values.extra ?? {},
        };
        const roleName = role?.name ?? values.roleKey;

        if (editing) {
            setSaving(true);
            const saved = await update(editing.id, record);
            setSaving(false);
            if (!saved) return;
            logChange('Users & Roles', 'User Modified', `${editing.name} (${roles.byKey[editing.roleKey]?.name ?? ''}, ${editing.status})`, `${record.name} (${roleName}, ${record.status})`);
            message.success(`${record.name} updated`);
            resetToNew();
            return;
        }

        // The API stores only a hash of the temp password and returns it once.
        setSaving(true);
        const user = await add({ ...record, createdAt: new Date().toISOString() });
        setSaving(false);
        if (!user) return;
        logChange('Users & Roles', 'User Created', '—', `${user.name} (${roleName})`);
        const done = modal.success({
            title: `${roleFormName(role)} account created`,
            width: 460,
            content: (
                <div className="text-[12px] leading-5">
                    <div><b>Name:</b> {user.name}</div>
                    <div><b>User ID:</b> {user.userId}</div>
                    <div><b>Temp password:</b> <code>{user.tempPassword}</code></div>
                    <div><b>Status:</b> {user.status}</div>
                    <div className="mt-2 text-slate-500">The user now appears in User Activation, Password Reset and the dashboard counts.</div>
                </div>
            ),
            okText: 'Create Another',
            closable: true,
            footer: (_, { OkBtn }) => (
                <>
                    <Button onClick={() => { done.destroy(); navigate(ROUTES.USER_ACTIVATION); }}>Go to User Activation</Button>
                    <OkBtn />
                </>
            ),
        });
        resetToNew(values.roleKey);
    };

    const loadPicked = async () => {
        const u = users.find((x) => x.id === pickedUser);
        if (!u || !(await loadForEdit(u.id))) return;
        setPickerOpen(false);
        setPickedUser(null);
        message.info(`Editing ${u.name}`);
    };

    const createRole = async (values) => {
        const name = values.name.trim();
        if (roles.list.some((r) => r.name.toLowerCase() === name.toLowerCase())) {
            roleForm.setFields([{ name: 'name', errors: ['A role with this name already exists'] }]);
            return;
        }
        // The server copies the permissions (view-only when no role is picked) and picks the key.
        const newRole = await roles.add({ name, level: values.level, copyFrom: values.copyFrom, permissions: undefined });
        if (!newRole) return;
        logChange('Users & Roles', 'Role Added', '—', `${name} (L${values.level})`);
        form.setFieldValue('roleKey', newRole.key);
        setRoleModalOpen(false);
        roleForm.resetFields();
        message.success(`Role "${name}" added — set its permissions in Roles & Permissions`);
    };

    const extra = role?.extra;
    const title = roleFormTitle(role);
    const submitLabel = `${editing ? 'Update' : 'Create'} ${role ? roleFormName(role) : ''} Account`.replace(/\s+/g, ' ');

    return (
        <>
            <h1 className="text-[20px] font-bold m-0 mb-1" style={{ color: COLORS.primary }}>Create New Account</h1>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="text-[16px] font-bold m-0" style={{ color: COLORS.primary }}>
                    {title}
                    {editing && <span className="ml-2 text-[12px] font-medium" style={{ color: COLORS.textSecondary }}>(modifying {editing.name})</span>}
                </h2>
                <div className="flex gap-2">
                    <Button type="primary" style={{ minWidth: 120 }} onClick={() => setPickerOpen(true)}>Modify user</Button>
                    <Button type="primary" icon={<PlusSquareOutlined />} style={{ minWidth: 120 }} onClick={() => resetToNew()}>Create</Button>
                </div>
            </div>

            <Form form={form} layout="vertical" requiredMark={requiredMark} onFinish={submit} onFinishFailed={() => message.error('Please fill all required fields')} scrollToFirstError>
                <div className="flex flex-col gap-3">
                    <Section>
                        <div className="max-w-[420px]">
                            <Form.Item name="accountType" label="Select Account Type" rules={req('Select account type')}>
                                <Select placeholder="Internal/External" options={toOptions(ACCOUNT_TYPES)} />
                            </Form.Item>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mb-2.5">
                            <h2 className="text-[15px] font-bold m-0" style={{ color: COLORS.primary }}>Role assignment</h2>
                            <Button type="primary" icon={<PlusSquareOutlined />} style={{ minWidth: 120 }} onClick={() => setRoleModalOpen(true)}>Add Role</Button>
                        </div>
                        <Grid>
                            <Form.Item name="roleKey" label="Role" rules={req('Select a role')}>
                                <Select
                                    placeholder="National Manager/RM/SM/CSM/Call Center/Internal Surveyor/"
                                    options={roleOptions}
                                    showSearch={{ optionFilterProp: 'label' }}
                                    onChange={() => form.setFieldValue('reportingManagerId', undefined)}
                                />
                            </Form.Item>
                            <Form.Item name="reportingManagerId" label="Reporting manager" rules={req('Select reporting manager')}>
                                <Select placeholder="Select Reporting Manager" options={managerOptions} showSearch={{ optionFilterProp: 'label' }} disabled={!role} />
                            </Form.Item>
                            <Form.Item name="name" label="Full Name" rules={[...req('Enter full name'), { pattern: /^[A-Za-z][A-Za-z .'-]{1,59}$/, message: 'Letters and spaces only' }]}>
                                <Input placeholder="Ajay Sharma" onBlur={suggestUserId} />
                            </Form.Item>
                            <Form.Item name="employeeId" label="Employee ID" rules={[...req('Enter employee ID'), unique('employeeId', 'Employee ID')]}>
                                <Input placeholder="EMP1234567890" />
                            </Form.Item>
                            <Form.Item name="email" label="Official Email ID" rules={[...req('Enter official email'), { type: 'email', message: 'Enter a valid email' }, unique('email', 'Email')]}>
                                <Input placeholder="Ajaysharma@companyname.com" />
                            </Form.Item>
                            <Form.Item name="contact" label="Contact Number" rules={[...req('Enter contact number'), { pattern: MOBILE_RE, message: 'Enter a valid 10-digit mobile number' }]}>
                                <Input placeholder="+91 1234567890" />
                            </Form.Item>
                            <Form.Item
                                name="altContact"
                                label="Alternate Contact Number"
                                dependencies={['contact']}
                                rules={[
                                    ...req('Enter alternate number'),
                                    { pattern: MOBILE_RE, message: 'Enter a valid 10-digit mobile number' },
                                    ({ getFieldValue }) => ({ validator: (_, v) => (v && v === getFieldValue('contact') ? Promise.reject(new Error('Must differ from contact number')) : Promise.resolve()) }),
                                ]}
                            >
                                <Input placeholder="+91 1234567890" />
                            </Form.Item>
                            <Form.Item name="department" label="Department">
                                <Select placeholder="Select Department" options={toOptions(DEPARTMENTS)} allowClear />
                            </Form.Item>
                            <Form.Item name="dateOfJoining" label="Date Of  Joining" rules={req('Select date of joining')}>
                                <DatePicker className="w-full" format="DD MMM YYYY" placeholder="05 Apr 2026" disabledDate={(d) => d.isAfter(dayjs().add(90, 'day'))} />
                            </Form.Item>
                            <Form.Item label="Role level (AG)">
                                <Input readOnly value={role ? `L${role.level} - ${role.name}` : ''} placeholder={ROLE_LEVEL_HINT} />
                            </Form.Item>
                            <Form.Item name="city" label="City" rules={req('Enter city')}>
                                <Input placeholder="Eg. Mumbai" />
                            </Form.Item>
                            <Form.Item name="state" label="State" rules={req('Select state')}>
                                <Select placeholder="Select State" options={toOptions(STATES)} showSearch />
                            </Form.Item>
                            <Form.Item name="region" label="Region" rules={req('Enter region')}>
                                <Input placeholder="Eg. West Region" />
                            </Form.Item>
                            <Form.Item name="country" label="Country" rules={req('Select country')}>
                                <Select placeholder="Select Country" options={toOptions(COUNTRIES)} />
                            </Form.Item>
                            <Form.Item name="pinCode" label="Pin Code" rules={[...req('Enter pin code'), { pattern: PIN_RE, message: 'Enter a 6-digit pin code' }]}>
                                <Input placeholder="400001" maxLength={6} />
                            </Form.Item>
                            <Form.Item name="profileImage" label="Upload Profile Image" rules={req('Upload a profile image')}>
                                <ImageUpload />
                            </Form.Item>
                        </Grid>
                    </Section>

                    <Section title="Geography scope">
                        <Grid>
                            <Form.Item name="zones" label="Zone" rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one zone' }]}>
                                <ZonePicker />
                            </Form.Item>
                            <Form.Item name="geoRegion" label="Region">
                                <Select placeholder="Select State" options={toOptions(zoneStates)} allowClear showSearch />
                            </Form.Item>
                            <Form.Item name="geoCity" label={accountType === 'Internal' ? 'City / District / Branch Office' : 'City / District'}>
                                <Input placeholder="Eg. Mumbai" />
                            </Form.Item>
                            <Form.Item name="geoState" label="State">
                                <Select placeholder="Select State" options={toOptions(zoneStates)} allowClear showSearch />
                            </Form.Item>
                        </Grid>
                    </Section>

                    <Section title="Platform & access">
                        <Grid>
                            <div>
                                <Form.Item name="platform" label="Platform access (AG)" rules={req('Choose platform access')}>
                                    <PlatformPicker />
                                </Form.Item>
                                <Form.Item name="status" label="Account status" rules={req('Select account status')}>
                                    <Select placeholder="Select Active / Inactive / On Leave / Suspended / Resigned" options={toOptions(ACCOUNT_STATUSES)} />
                                </Form.Item>
                            </div>
                            <div>
                                <Form.Item name="effectiveFrom" label="Effective from date" rules={req('Select effective date')}>
                                    <DatePicker className="w-full" format="DD MMM YYYY" placeholder="Select Date" />
                                </Form.Item>
                                <Form.Item
                                    name="userId"
                                    label="User ID"
                                    rules={[...req('Enter user ID'), { pattern: /^[a-zA-Z0-9._-]{4,30}$/, message: '4-30 letters, numbers, . _ -' }, unique('userId', 'User ID')]}
                                >
                                    <Input placeholder="User ID" />
                                </Form.Item>
                                <Form.Item label="Temp password (AG)">
                                    <div className="flex gap-2">
                                        <Form.Item name="tempPassword" noStyle>
                                            <Input.Password readOnly />
                                        </Form.Item>
                                        <Tooltip title="Generate new password">
                                            <Button icon={<ReloadOutlined />} onClick={() => form.setFieldValue('tempPassword', generatePassword())} />
                                        </Tooltip>
                                    </div>
                                </Form.Item>
                            </div>
                        </Grid>
                    </Section>

                    {extra && extra !== 'national-manager' && (
                        <Section title={`Role-specific extra fields — ${roleFormName(role).toLowerCase()}`}>
                            <Grid>
                                {extra === 'call-center' && (
                                    <>
                                        <Form.Item name={['extra', 'shift']} label="Shift" rules={req('Select shift')}>
                                            <Select placeholder="Select Shift" options={toOptions(SHIFTS)} />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'agentCode']} label="Agent code (AG)" rules={[{ pattern: /^CC-\d{4}$/, message: 'Format: CC-XXXX' }, { validator: (_, v) => (v && users.some((u) => u.id !== editingId && u.extra?.agentCode === v) ? Promise.reject(new Error('Agent code already used')) : Promise.resolve()) }]}>
                                            <Input placeholder="Format: CC-XXXX, unique" />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'languages']} label="Language proficiency" rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one language' }]}>
                                            <Checkbox.Group options={LANGUAGES} />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'skills']} label="Skill tags" rules={[{ required: true, type: 'array', min: 1, message: 'Select at least one skill' }]}>
                                            <Checkbox.Group options={SKILL_TAGS} />
                                        </Form.Item>
                                    </>
                                )}
                                {extra === 'claim-handler' && (
                                    <>
                                        <Form.Item name={['extra', 'city']} label="City" rules={req('Enter city')}>
                                            <Input placeholder="Enter City Name" />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'state']} label="State" rules={req('Select state')}>
                                            <Select placeholder="Select State" options={toOptions(STATES)} showSearch />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'branchId']} label="Assigned Branch" rules={req('Select branch')}>
                                            <Select
                                                placeholder="Select Branch"
                                                showSearch={{ optionFilterProp: 'label' }}
                                                options={branches.filter((b) => b.status !== 'Suspended').map((b) => ({ value: b.id, label: `${b.name} — ${b.organization}` }))}
                                            />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'designation']} label="Designation" rules={req('Select designation')}>
                                            <Select placeholder="Select Designation" options={toOptions(HANDLER_DESIGNATIONS)} />
                                        </Form.Item>
                                    </>
                                )}
                                {extra === 'state-manager' && (
                                    <>
                                        <Form.Item name={['extra', 'designation']} label="Designation" rules={req('Enter designation')}>
                                            <Input placeholder="e.g. State Manager — Maharashtra" />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'stateAssigned']} label="State assigned" rules={req('Select state')}>
                                            <Select placeholder="Select State" options={toOptions(STATES)} showSearch />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'surveyorAccess']} label="Surveyor coordination access" valuePropName="checked" rules={[{ required: true }]}>
                                            <Switch />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'workshopAccess']} label="Workshop coordination access" valuePropName="checked" rules={[{ required: true }]}>
                                            <Switch />
                                        </Form.Item>
                                    </>
                                )}
                                {extra === 'regional-manager' && (
                                    <>
                                        <Form.Item name={['extra', 'designation']} label="Designation" rules={req('Enter designation')}>
                                            <Input placeholder="e.g. Regional Claims Head — West" />
                                        </Form.Item>
                                        <Form.Item name={['extra', 'regionName']} label="Region name" rules={req('Select zone')}>
                                            <Select placeholder="Select Zone" options={toOptions(ZONE_REAL)} onChange={() => form.setFieldValue(['extra', 'statesCovered'], [])} />
                                        </Form.Item>
                                        <Form.Item noStyle dependencies={[['extra', 'regionName']]}>
                                            {({ getFieldValue }) => (
                                                <Form.Item name={['extra', 'statesCovered']} label="States covered" rules={[{ required: true, type: 'array', min: 1, message: 'Select at least 1 state' }]}>
                                                    <Select mode="multiple" placeholder="Select State Min 1" options={toOptions(ZONE_STATES[getFieldValue(['extra', 'regionName'])] ?? STATES)} />
                                                </Form.Item>
                                            )}
                                        </Form.Item>
                                    </>
                                )}
                            </Grid>
                        </Section>
                    )}

                    <div className="flex justify-end gap-2">
                        {editing && <Button onClick={() => resetToNew()}>Cancel</Button>}
                        <Button type="primary" htmlType="submit" loading={saving} style={{ minWidth: 160 }}>{submitLabel}</Button>
                    </div>
                </div>
            </Form>

            <Modal title="Modify user" open={pickerOpen} onCancel={() => setPickerOpen(false)} onOk={loadPicked} okText="Load User" okButtonProps={{ disabled: !pickedUser }} destroyOnHidden>
                <p className="text-[12px] text-slate-600">Pick a user to load their details into the form.</p>
                <Select
                    className="w-full"
                    showSearch={{ optionFilterProp: 'label' }}
                    placeholder="Search by name, user ID or employee ID"
                    value={pickedUser}
                    onChange={setPickedUser}
                    options={users.map((u) => ({ value: u.id, label: `${u.name} · ${u.userId} · ${u.employeeId} (${roles.byKey[u.roleKey]?.name ?? u.roleKey})` }))}
                />
            </Modal>

            <Modal title="Add Role" open={roleModalOpen} onCancel={() => setRoleModalOpen(false)} onOk={() => roleForm.submit()} okText="Add Role" destroyOnHidden>
                <Form form={roleForm} layout="vertical" onFinish={createRole} initialValues={{ level: 5 }} requiredMark={requiredMark}>
                    <Form.Item name="name" label="Role name" rules={req('Enter role name')}>
                        <Input placeholder="e.g. Senior Surveyor" maxLength={40} />
                    </Form.Item>
                    <Form.Item name="level" label="Role level" rules={req('Select level')} extra={ROLE_LEVEL_HINT}>
                        <InputNumber min={1} max={5} className="w-full" addonBefore="L" />
                    </Form.Item>
                    <Form.Item name="copyFrom" label="Copy permissions from">
                        <Select placeholder="Start with view-only permissions" allowClear options={roles.list.map((r) => ({ value: r.key, label: r.name }))} />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default CreateUserPage;
