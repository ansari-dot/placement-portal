import StudentModel from '../student/student.model.js';
import WorkflowModel from '../workflow/workflow.model.js';
import PaymentModel from '../payment/payment.model.js';
import RtoModel from '../rto/rto.model.js';
import IndustryModel from '../industry/industry.model.js';
import { buildPhoneSearchPatterns, normalizePhone } from '../../core/utils/phoneNormalizer.js';

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const globalSearchController = async (req, res, next) => {
  try {
    const rawQuery = String(req.query.q || '').trim();
    if (!rawQuery) {
      return res.status(200).json({
        success: true,
        data: {
          students: [],
          requests: [],
          appointments: [],
          placements: [],
          payments: [],
          rtos: [],
          industries: [],
        },
      });
    }

    const clean = escapeRegex(rawQuery);
    const textRegex = new RegExp(clean, 'i');

    // Phone search patterns (handling Australian phone formats: 04..., +61..., 61..., spaces, dashes)
    const phonePatterns = buildPhoneSearchPatterns(rawQuery);
    const phoneRegexes = phonePatterns.map((pat) => new RegExp(pat, 'i'));

    // Construct student OR query covering Name, Email, Phone, City/Suburb, State, ZIP/Postcode, etc.
    const studentOrConditions = [
      { name: textRegex },
      { firstName: textRegex },
      { lastName: textRegex },
      { preferredName: textRegex },
      { studentId: textRegex },
      { emailAddress: textRegex },
      { email: textRegex },
      { courseQualification: textRegex },
      { courses: textRegex },
      { assignedRto: textRegex },
      { institute: textRegex },
      { placementStatus: textRegex },
      { suburb: textRegex },
      { city: textRegex },
      { state: textRegex },
      { postCode: textRegex },
      { address: textRegex },
    ];

    // Add phone regex conditions for all phone number fields
    phoneRegexes.forEach((pRegex) => {
      studentOrConditions.push(
        { phoneNumber: pRegex },
        { alternatePhone: pRegex },
        { whatsappNumber: pRegex },
        { phone: pRegex }
      );
    });

    const [matchedStudents, workflows, initialPayments, rtos, industries] = await Promise.all([
      StudentModel.find({ $or: studentOrConditions })
        .select('_id studentId name firstName lastName emailAddress email phoneNumber address suburb state postCode assignedRto courseQualification courses placementStatus status')
        .limit(20)
        .lean(),

      WorkflowModel.find().lean(),

      PaymentModel.find({
        $or: [
          { studentName: textRegex },
          { studentId: textRegex },
          { rto: textRegex },
          { course: textRegex },
          { invoiceNumber: textRegex },
          { placementStatus: textRegex },
          { paymentStatus: textRegex },
        ],
      })
        .select('_id student studentId studentName rto course paymentAmount totalAmount placementStatus paymentStatus invoiceNumber')
        .limit(10)
        .lean(),

      RtoModel.find({
        $or: [
          { name: textRegex },
          { code: textRegex },
          { contactName: textRegex },
          { email: textRegex },
        ],
      })
        .select('_id name code contactName email phone address')
        .limit(6)
        .lean(),

      IndustryModel.find({
        $or: [
          { name: textRegex },
          { companyName: textRegex },
          { organizationName: textRegex },
          { industryType: textRegex },
          { contactPerson: textRegex },
          { contactPersonName: textRegex },
          { email: textRegex },
          { contactEmail: textRegex },
        ],
      })
        .select('_id name companyName organizationName industryType contactPerson contactPersonName email contactEmail phone contactPhone address')
        .limit(6)
        .lean(),
    ]);

    // Gather IDs and names of matched students to correlate across all workflow steps
    const matchedStudentBizIds = new Set();
    const matchedStudentDbIds = new Set();
    const matchedStudentNames = new Set();
    const matchedStudentEmails = new Set();

    matchedStudents.forEach((s) => {
      if (s._id) matchedStudentDbIds.add(String(s._id));
      if (s.studentId) matchedStudentBizIds.add(String(s.studentId).trim().toLowerCase());
      const fullName = (s.name || `${s.firstName || ''} ${s.lastName || ''}`).trim().toLowerCase();
      if (fullName) matchedStudentNames.add(fullName);
      if (s.emailAddress) matchedStudentEmails.add(String(s.emailAddress).trim().toLowerCase());
      if (s.email) matchedStudentEmails.add(String(s.email).trim().toLowerCase());
    });

    const isStudentCorrelated = (targetId, targetName, targetEmail) => {
      const idNorm = String(targetId || '').trim().toLowerCase();
      const nameNorm = String(targetName || '').trim().toLowerCase();
      const emailNorm = String(targetEmail || '').trim().toLowerCase();
      return (
        (idNorm && (matchedStudentBizIds.has(idNorm) || matchedStudentDbIds.has(idNorm))) ||
        (nameNorm && matchedStudentNames.has(nameNorm)) ||
        (emailNorm && matchedStudentEmails.has(emailNorm))
      );
    };

    // Extract workflow subdocuments matching query directly OR correlating to matched students
    const allRequests = [];
    const allAppointments = [];
    const allInternships = [];

    workflows.forEach((wf) => {
      (wf.requests || []).forEach((r) => {
        const text = `${r.reqId || ''} ${r.title || ''} ${r.student || ''} ${r.studentId || ''} ${r.company || ''} ${r.rto || ''} ${r.status || ''}`;
        const matchesDirectly = textRegex.test(text);
        const matchesStudent = isStudentCorrelated(r.studentId, r.student, r.email);

        if (matchesDirectly || matchesStudent) {
          allRequests.push({
            id: r._id || r.id,
            reqId: r.reqId,
            title: r.title,
            student: r.student,
            studentId: r.studentId,
            company: r.company,
            rto: r.rto,
            status: r.status,
          });
        }
      });

      (wf.appointments || []).forEach((a) => {
        const text = `${a.apptId || ''} ${a.student || ''} ${a.studentId || ''} ${a.company || ''} ${a.position || ''} ${a.status || ''} ${a.email || ''} ${a.phone || ''}`;
        const matchesDirectly = textRegex.test(text);
        const matchesStudent = isStudentCorrelated(a.studentId, a.student, a.email);

        if (matchesDirectly || matchesStudent) {
          allAppointments.push({
            id: a._id || a.id,
            apptId: a.apptId,
            student: a.student,
            studentId: a.studentId,
            company: a.company,
            position: a.position,
            status: a.status,
            date: a.date,
          });
        }
      });

      (wf.internships || []).forEach((i) => {
        const text = `${i.intId || ''} ${i.student || ''} ${i.studentId || ''} ${i.company || ''} ${i.title || ''} ${i.status || ''}`;
        const matchesDirectly = textRegex.test(text);
        const matchesStudent = isStudentCorrelated(i.studentId, i.student, i.email);

        if (matchesDirectly || matchesStudent) {
          allInternships.push({
            id: i._id || i.id,
            intId: i.intId,
            student: i.student,
            studentId: i.studentId,
            company: i.company,
            title: i.title,
            status: i.status,
            start: i.start,
            end: i.end,
          });
        }
      });
    });

    // Also bring in correlated payments if student matched
    let allPayments = [...initialPayments];
    if (matchedStudentBizIds.size > 0 || matchedStudentDbIds.size > 0) {
      const correlatedPayments = await PaymentModel.find({
        $or: [
          { studentId: { $in: Array.from(matchedStudentBizIds) } },
          { student: { $in: Array.from(matchedStudentDbIds) } },
        ],
      })
        .select('_id student studentId studentName rto course paymentAmount totalAmount placementStatus paymentStatus invoiceNumber')
        .limit(10)
        .lean();

      const existingPaymentIds = new Set(allPayments.map((p) => String(p._id)));
      correlatedPayments.forEach((cp) => {
        if (!existingPaymentIds.has(String(cp._id))) {
          allPayments.push(cp);
          existingPaymentIds.add(String(cp._id));
        }
      });
    }

    const mappedStudents = matchedStudents.map((s) => ({
      id: s._id,
      studentId: s.studentId,
      name: s.name || [s.firstName, s.lastName].filter(Boolean).join(' ') || 'Student',
      email: s.emailAddress || s.email || '',
      phone: s.phoneNumber || '',
      location: [s.suburb, s.state, s.postCode].filter(Boolean).join(', '),
      rto: s.assignedRto || s.institute || '',
      course: s.courseQualification || s.courses || '',
      placementStatus: s.placementStatus || 'Awaiting',
      status: s.status || 'Active',
    }));

    return res.status(200).json({
      success: true,
      data: {
        students: mappedStudents.slice(0, 8),
        requests: allRequests.slice(0, 8),
        appointments: allAppointments.slice(0, 8),
        placements: allInternships.slice(0, 8),
        payments: allPayments.slice(0, 8),
        rtos: rtos.slice(0, 6),
        industries: industries.slice(0, 6),
      },
    });
  } catch (error) {
    next(error);
  }
};
