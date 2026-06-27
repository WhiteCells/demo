export function hasPermission(permissionCodes, code) {
  return permissionCodes.includes(code);
}

export function hasAnyPermission(permissionCodes, codes) {
  return codes.some((code) => permissionCodes.includes(code));
}
