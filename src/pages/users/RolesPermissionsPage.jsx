import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, App, Tooltip } from 'antd';
import { EditOutlined, PlusSquareOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import OnOffSwitch from '../../components/ui/OnOffSwitch';
import { COLORS } from '../../constants/theme';
import { ROUTES } from '../../constants/routes';
import { PERMISSION_MODULES, PERMISSION_ACTIONS } from '../../data/roles';
import { useCollection, useLogChange, useRoles } from '../../store/AdminStore';

const InfoBox = ({ label, value }) => (
    <div className="rounded-md px-3 py-1.5 min-w-0" style={{ background: '#F4F4F4', border: '1px solid #E5E5E5' }}>
        <div className="text-[10px]" style={{ color: '#B3B3B3' }}>{label}</div>
        <div className="text-[13.5px] font-semibold truncate">{value}</div>
    </div>
);

/**
 * User Creation & Role Permissions -- pick a role tab, "Edit/Modify" to
 * unlock the page x action matrix, "Save" to store it. "Add User" opens
 * Create Users with this role preselected.
 */
const RolesPermissionsPage = () => {
    const navigate = useNavigate();
    const { message, modal } = App.useApp();
    const roles = useRoles();
    const { items: users } = useCollection('users');
    const logChange = useLogChange();

    const [activeKey, setActiveKey] = useState(roles.list[0]?.key);
    const [editing, setEditing] = useState(false);
    const role = roles.byKey[activeKey] ?? roles.list[0];
    const [draft, setDraft] = useState(role?.permissions);

    useEffect(() => {
        setDraft(role?.permissions);
        setEditing(false);
    }, [role]);

    const usersInRole = users.filter((u) => u.roleKey === role?.key).length;
    const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(role?.permissions), [draft, role]);

    const switchRole = (key) => {
        if (key === activeKey) return;
        if (editing && dirty) {
            modal.confirm({
                title: 'Discard unsaved changes?',
                content: `Permission changes for ${role.name} have not been saved.`,
                okText: 'Discard',
                onOk: () => setActiveKey(key),
            });
            return;
        }
        setActiveKey(key);
    };

    const setCell = (module, action, value) => setDraft((d) => ({ ...d, [module]: { ...d[module], [action]: value } }));

    // Whole column on/off from the header (edit mode only).
    const setColumn = (action, value) => setDraft((d) => Object.fromEntries(Object.entries(d).map(([m, acts]) => [m, { ...acts, [action]: value }])));

    const save = async () => {
        if (!editing) {
            message.info('Click Edit/Modify to change permissions first.');
            return;
        }
        const changed = [];
        PERMISSION_MODULES.forEach((m) => PERMISSION_ACTIONS.forEach((a) => {
            if (role.permissions[m]?.[a.key] !== draft[m]?.[a.key]) changed.push({ m, a: a.label, from: role.permissions[m]?.[a.key], to: draft[m]?.[a.key] });
        }));
        if (!changed.length) {
            setEditing(false);
            message.info('No changes to save.');
            return;
        }
        if (!(await roles.update(role.key, { permissions: draft }))) return;
        if (changed.length <= 3) changed.forEach((c) => logChange('Roles & Permissions', `${role.name}: ${c.m} · ${c.a}`, c.from ? 'ON' : 'OFF', c.to ? 'ON' : 'OFF'));
        else logChange('Roles & Permissions', `${role.name} permissions`, '—', `${changed.length} permissions updated`);
        setEditing(false);
        message.success(`${role.name} permissions saved`);
    };

    const cancelEdit = () => {
        setDraft(role.permissions);
        setEditing(false);
    };

    if (!role) return null;
    const enabledCount = PERMISSION_MODULES.reduce((n, m) => n + PERMISSION_ACTIONS.filter((a) => draft?.[m]?.[a.key]).length, 0);

    return (
        <>
            <h1 className="text-[20px] font-bold m-0 mb-3" style={{ color: COLORS.primary }}>User Creation &amp; Role Permissions</h1>

            <div className="rounded-lg px-3 py-2.5 mb-2 flex flex-wrap items-center justify-between gap-3" style={{ background: '#F4F4F4', border: '1px solid #E5E5E5' }}>
                <div>
                    <div className="text-[13.5px] font-semibold" style={{ color: COLORS.primary }}>Users &amp; Roles</div>
                    <div className="text-[11px] font-medium">Create Sub-Users IDs &amp; Control Page-Level View, Edit, Create &amp; Approval Rights</div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {editing ? (
                        <Button icon={<CloseOutlined />} onClick={cancelEdit} style={{ background: COLORS.primarySoft, color: COLORS.primary, border: 'none', minWidth: 100 }}>Cancel Edit</Button>
                    ) : (
                        <Button icon={<EditOutlined />} onClick={() => setEditing(true)} style={{ background: COLORS.primarySoft, color: COLORS.primary, border: 'none', minWidth: 100 }}>Edit/Modify</Button>
                    )}
                    <Button type="primary" icon={<PlusSquareOutlined />} style={{ minWidth: 100 }} onClick={() => navigate(`${ROUTES.CREATE_USERS}?role=${role.key}`)}>Add User</Button>
                    <Button type="primary" icon={<SaveOutlined />} style={{ minWidth: 100 }} onClick={save} disabled={editing && !dirty}>Save</Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-2">
                {roles.list.map((r) => {
                    const on = r.key === role.key;
                    return (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => switchRole(r.key)}
                            className="rounded-md px-2 py-1 text-[11px] font-medium"
                            style={{ background: on ? COLORS.primary : '#F4F4F4', color: on ? '#fff' : '#B3B3B3', border: `1px solid ${on ? COLORS.primary : '#E5E5E5'}` }}
                        >
                            {r.name}
                        </button>
                    );
                })}
            </div>

            <div className="grid gap-2 grid-cols-1 sm:grid-cols-3 max-w-[720px] mb-2">
                <InfoBox label="Select Role" value={role.name} />
                <InfoBox label="Permission Model" value="Page + Action Level" />
                <InfoBox label="Users In Role" value={usersInRole} />
            </div>

            <div className="rounded-lg overflow-hidden" style={{ background: '#F4F4F4', border: '1px solid #E5E5E5' }}>
                <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <h3 className="text-[14px] font-semibold m-0" style={{ color: COLORS.primary }}>Page &amp; Permission Matrix</h3>
                    <span className="text-[11px]" style={{ color: COLORS.textSecondary }}>
                        {enabledCount} of {PERMISSION_MODULES.length * PERMISSION_ACTIONS.length} permissions on{editing ? ' · editing' : ' · click Edit/Modify to change'}
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[12px]" style={{ minWidth: 720, borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: COLORS.primary, color: '#fff' }}>
                                <th className="text-left font-medium px-3 py-2">Page/Module</th>
                                {PERMISSION_ACTIONS.map((a) => (
                                    <th key={a.key} className="font-medium px-2 py-2 text-center">
                                        {editing ? (
                                            <Tooltip title={`Turn all ${a.label} on / off`}>
                                                <button type="button" className="text-white" onClick={() => setColumn(a.key, !PERMISSION_MODULES.every((m) => draft[m]?.[a.key]))}>{a.label}</button>
                                            </Tooltip>
                                        ) : a.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {PERMISSION_MODULES.map((m) => (
                                <tr key={m} style={{ borderBottom: '1px solid #DDDDDD' }}>
                                    <td className="px-3 py-1.5 font-medium">{m}</td>
                                    {PERMISSION_ACTIONS.map((a) => (
                                        <td key={a.key} className="px-2 py-1.5 text-center">
                                            <OnOffSwitch checked={!!draft?.[m]?.[a.key]} disabled={!editing} onChange={(v) => setCell(m, a.key, v)} ariaLabel={`${m} ${a.label}`} />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

export default RolesPermissionsPage;
