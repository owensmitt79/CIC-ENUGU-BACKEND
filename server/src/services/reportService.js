export class ReportService {
  /**
   * Escape and format a value for CSV row
   * @param {*} val
   * @returns {string}
   */
  static escapeCsv(val) {
    if (val === null || val === undefined) return '""';
    let str = String(val);
    if (Array.isArray(val)) {
      str = val.join(', ');
    }
    // Escape quotes
    return `"${str.replace(/"/g, '""')}"`;
  }

  /**
   * Convert payment ledger records into CSV format
   * @param {Array<Object>} payments
   * @returns {string}
   */
  static paymentsToCsv(payments = []) {
    const headers = [
      'Reference',
      'Receipt Number',
      'Date',
      'Name',
      'Email',
      'Phone',
      'Payment Type',
      'Selected Months',
      'Amount (NGN)',
      'Gateway',
      'Channel',
      'Status',
      'Recorded By'
    ];

    const rows = payments.map((p) => {
      let months = p.selectedMonths;
      if (typeof months === 'string') {
        try {
          const parsed = JSON.parse(months);
          if (Array.isArray(parsed)) months = parsed.join(', ');
        } catch (_) {}
      }

      return [
        this.escapeCsv(p.reference),
        this.escapeCsv(p.receiptNumber),
        this.escapeCsv(p.date),
        this.escapeCsv(p.name),
        this.escapeCsv(p.email),
        this.escapeCsv(p.phone),
        this.escapeCsv(p.paymentType),
        this.escapeCsv(months),
        this.escapeCsv(p.amount),
        this.escapeCsv(p.gateway),
        this.escapeCsv(p.channel),
        this.escapeCsv(p.status),
        this.escapeCsv(p.recordedBy)
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\r\n');
  }

  /**
   * Convert alumni member records into CSV format
   * @param {Array<Object>} members
   * @returns {string}
   */
  static membersToCsv(members = []) {
    const headers = [
      'Member ID',
      'Full Name',
      'Email Address',
      'Phone Number',
      'Chapter',
      'Profession',
      'Dues Status',
      'Class Year'
    ];

    const rows = members.map((m) => [
      this.escapeCsv(m.id),
      this.escapeCsv(m.name),
      this.escapeCsv(m.email),
      this.escapeCsv(m.phone),
      this.escapeCsv(m.chapter),
      this.escapeCsv(m.profession || 'N/A'),
      this.escapeCsv(m.duesStatus),
      this.escapeCsv(m.joinYear || 1995)
    ].join(','));

    return [headers.join(','), ...rows].join('\r\n');
  }
}

export default ReportService;
