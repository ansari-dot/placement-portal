export class ApiResponse {
  static success(data = null, message = null, extra = {}) {
    const payload = { success: true };
    if (message) payload.message = message;
    if (data !== undefined && data !== null) payload.data = data;
    return Object.assign(payload, extra);
  }

  static created(data = null, message = 'Resource created successfully', extra = {}) {
    return this.success(data, message, extra);
  }

  static paginated(data, pagination, message = null) {
    return this.success(data, message, { pagination });
  }

  static error(message = 'An error occurred', extra = {}) {
    return Object.assign({ success: false, message }, extra);
  }
}
