## 📋 Description

<!-- Provide a brief description of the changes in this PR -->

## 🎯 Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Code style update (formatting, renaming)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔒 Security fix
- [ ] 🏥 HIPAA compliance update

## 🔗 Related Issues

<!-- Link to related issues -->
Closes #(issue number)

## 🧪 Testing

<!-- Describe the tests you ran to verify your changes -->

- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Security testing completed (if applicable)
- [ ] HIPAA compliance verified (if applicable)

### Test Coverage
<!-- Add test coverage percentage if applicable -->
- Coverage: __%

## 📸 Screenshots (if applicable)

<!-- Add screenshots to help explain your changes -->

## 🔒 Security Checklist

<!-- Mark completed items with an 'x' -->

- [ ] No secrets or credentials in code
- [ ] No PHI (Protected Health Information) logged
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Authentication/authorization checked
- [ ] Rate limiting considered
- [ ] CORS configuration reviewed

## 🏥 HIPAA Compliance Checklist

<!-- Mark completed items with an 'x' if this PR handles patient data -->

- [ ] Audit logging implemented for sensitive operations
- [ ] Data encryption verified
- [ ] Access controls implemented
- [ ] Consent management verified
- [ ] Data retention policies followed
- [ ] No actual PHI in test data

## ⚡ Performance Checklist

<!-- Mark completed items with an 'x' -->

- [ ] No N+1 query problems
- [ ] Database indexes added (if needed)
- [ ] Caching implemented (if applicable)
- [ ] ML models loaded at startup (not per-request)
- [ ] Connection pooling verified
- [ ] Memory leaks checked

## 📚 Documentation

<!-- Mark completed items with an 'x' -->

- [ ] Code comments added/updated
- [ ] API documentation updated
- [ ] README updated (if needed)
- [ ] CHANGELOG updated
- [ ] Migration guide added (if breaking change)

## ✅ Checklist

<!-- Mark completed items with an 'x' -->

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
- [ ] Any dependent changes have been merged and published

## 🤖 CodeRabbit Instructions

<!-- Optional: Add specific instructions for CodeRabbit -->

@coderabbitai 
<!-- Example instructions:
- Focus on security review
- Check HIPAA compliance
- Review performance optimizations
- Verify error handling
-->

## 📝 Additional Notes

<!-- Add any additional notes or context -->

---

**Reviewer Notes:**
- Please review security implications carefully
- Check for HIPAA compliance if handling patient data
- Verify performance impact for database changes
- Ensure proper error handling and logging (no PHI!)
