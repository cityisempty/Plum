import React from 'react';
import { X } from 'lucide-react';

interface PolicyDialogProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'terms' | 'privacy';
    theme: 'classic' | 'modern';
}

export function PolicyDialog({ isOpen, onClose, type, theme }: PolicyDialogProps) {
    if (!isOpen) return null;

    const bgClass = theme === 'classic'
        ? 'bg-white'
        : 'bg-slate-900';

    const textClass = theme === 'classic'
        ? 'text-slate-900'
        : 'text-slate-100';

    const secondaryTextClass = theme === 'classic'
        ? 'text-slate-600'
        : 'text-slate-400';

    const borderClass = theme === 'classic'
        ? 'border-slate-200'
        : 'border-slate-700';

    const title = type === 'terms' ? '用户协议' : '隐私政策';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className={`relative w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl ${bgClass} overflow-hidden flex flex-col`}>
                {/* Header */}
                <div className={`flex items-center justify-between p-6 border-b ${borderClass}`}>
                    <h2 className={`text-2xl font-light ${textClass}`}>
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full hover:bg-black/5 transition-all ${textClass}`}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className={`flex-1 overflow-y-auto p-6 ${secondaryTextClass}`}>
                    {type === 'terms' ? <TermsContent /> : <PrivacyContent />}
                </div>

                {/* Footer */}
                <div className={`p-4 border-t ${borderClass} flex justify-center`}>
                    <button
                        onClick={onClose}
                        className={`px-6 py-2 rounded-lg ${theme === 'classic' ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-indigo-600 text-white hover:bg-indigo-500'} transition-all`}
                    >
                        我已阅读
                    </button>
                </div>
            </div>
        </div>
    );
}

function TermsContent() {
    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <section>
                <h3 className="text-lg font-semibold mb-3">欢迎使用心点通决策模型测试服务</h3>
                <p>
                    在使用本服务之前,请您仔细阅读并理解本用户协议。使用本服务即表示您同意接受本协议的所有条款和条件。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">1. 服务说明</h3>
                <p className="mb-2">
                    1.1 本服务是一个基于AI技术的决策模型测试工具,通过沙盘游戏的方式帮助用户探索自己的决策思维模式。
                </p>
                <p className="mb-2">
                    1.2 本服务<strong className="text-orange-500">仅供娱乐和自我探索使用</strong>,不具有任何专业心理咨询、医疗诊断或决策指导的性质。
                </p>
                <p>
                    1.3 本服务的所有输出结果均由AI模型生成,不代表任何专业意见或建议。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">2. 使用规则</h3>
                <p className="mb-2">
                    2.1 您需要登录账户并拥有足够的服务点数才能使用本服务。每次生成 AI 解读会消耗 1 点。
                </p>
                <p className="mb-2">
                    2.2 账户仅供本人使用,请妥善保管登录凭据,不得转让、出售或以任何方式分享给他人。
                </p>
                <p className="mb-2">
                    2.3 您应当合理使用本服务,不得进行任何可能损害服务正常运行的行为。
                </p>
                <p>
                    2.4 禁止使用本服务进行任何违法、违规或侵犯他人权益的活动。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">3. 免责声明</h3>
                <p className="mb-2">
                    3.1 <strong className="text-red-500">本服务不对任何输出结果的准确性、完整性、可靠性或适用性作出任何保证。</strong>
                </p>
                <p className="mb-2">
                    3.2 用户基于本服务输出结果所做的任何决策或行为,由用户自行承担全部责任。
                </p>
                <p className="mb-2">
                    3.3 本服务不对因使用或无法使用本服务而导致的任何直接、间接、偶然、特殊或后果性损害承担责任。
                </p>
                <p>
                    3.4 如您有心理健康或决策方面的专业需求,请咨询专业的心理咨询师或相关领域的专家。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">4. 知识产权</h3>
                <p className="mb-2">
                    4.1 本服务的所有内容,包括但不限于文字、图片、界面设计、代码等,均受知识产权法保护。
                </p>
                <p>
                    4.2 未经授权,您不得复制、修改、传播或以其他方式使用本服务的任何内容。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">5. 协议变更</h3>
                <p className="mb-2">
                    5.1 我们保留随时修改本协议的权利,修改后的协议将在服务中公布。
                </p>
                <p>
                    5.2 继续使用本服务即表示您接受修改后的协议。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">6. 其他条款</h3>
                <p className="mb-2">
                    6.1 本协议的解释、效力及纠纷的解决均适用中华人民共和国法律。
                </p>
                <p>
                    6.2 如本协议的任何条款被认定为无效或不可执行,该条款应被视为可分割,不影响其他条款的效力。
                </p>
            </section>

            <div className="mt-6 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <p className="text-orange-700 dark:text-orange-400 font-semibold">
                    ⚠️ 重要提示:本服务仅供娱乐,不作为任何决策、评价或分析的依据。我们不对任何输出结果负责。
                </p>
            </div>
        </div>
    );
}

function PrivacyContent() {
    return (
        <div className="space-y-6 text-sm leading-relaxed">
            <section>
                <h3 className="text-lg font-semibold mb-3">隐私政策</h3>
                <p>
                    我们非常重视您的隐私保护。本隐私政策说明了我们如何收集、使用、存储和保护您的个人信息。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">1. 信息收集</h3>
                <p className="mb-2">
                    1.1 <strong>基本信息</strong>:我们会收集您在使用服务时主动提供的信息,包括:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 mb-2">
                    <li>性别和年龄(用于个性化AI解读)</li>
                    <li>决策主题(您希望探索的问题)</li>
                    <li>选择的卡牌和摆放位置</li>
                </ul>
                <p className="mb-2">
                    1.2 <strong>技术信息</strong>:我们会自动收集以下技术信息:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>IP地址(用于安全防护和使用统计)</li>
                    <li>浏览器类型和版本</li>
                    <li>访问时间和使用记录</li>
                    <li>账户点数消费和服务使用记录</li>
                </ul>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">2. 信息使用</h3>
                <p className="mb-2">
                    2.1 我们收集的信息仅用于以下目的:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>提供和改进服务质量</li>
                    <li>生成个性化的AI解读结果</li>
                    <li>防止滥用和保护服务安全</li>
                    <li>进行匿名的使用统计和分析</li>
                </ul>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">3. 信息存储</h3>
                <p className="mb-2">
                    3.1 <strong>本地存储</strong>:您的性别、年龄等个人偏好信息存储在您的浏览器本地,我们不会将其上传到服务器。
                </p>
                <p className="mb-2">
                    3.2 <strong>服务器存储</strong>:账户信息、点数流水、IP地址和访问日志存储在我们的安全服务器上。
                </p>
                <p>
                    3.3 <strong>AI解读内容</strong>:您的决策主题和AI解读结果不会被永久存储,仅在生成过程中临时使用。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">4. 信息保护</h3>
                <p className="mb-2">
                    4.1 我们采用行业标准的安全措施保护您的信息,包括:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 mb-2">
                    <li>HTTPS加密传输</li>
                    <li>账户凭据和敏感信息采用加密或哈希方式保护</li>
                    <li>严格的访问控制和权限管理</li>
                    <li>定期的安全审计和更新</li>
                </ul>
                <p>
                    4.2 尽管我们采取了合理的安全措施,但无法保证信息的绝对安全。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">5. 信息共享</h3>
                <p className="mb-2">
                    5.1 <strong>我们不会出售、交易或转让您的个人信息给第三方。</strong>
                </p>
                <p className="mb-2">
                    5.2 我们可能会与以下第三方共享必要的信息:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 mb-2">
                    <li>AI服务提供商(Google Gemini/OpenAI):仅用于生成解读结果</li>
                    <li>云服务提供商(Cloudflare):用于托管和CDN服务</li>
                </ul>
                <p>
                    5.3 在法律要求或保护我们合法权益的情况下,我们可能会披露您的信息。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">6. Cookie和本地存储</h3>
                <p className="mb-2">
                    6.1 我们使用浏览器的本地存储(localStorage)来保存您的偏好设置；登录状态由安全 Cookie 维护。
                </p>
                <p className="mb-2">
                    6.2 您可以随时清除浏览器的本地存储,但这可能影响服务的正常使用。
                </p>
                <p>
                    6.3 我们不使用第三方跟踪Cookie。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">7. 您的权利</h3>
                <p className="mb-2">
                    7.1 您有权随时:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>查看和修改您的本地存储信息</li>
                    <li>清除浏览器中存储的所有数据</li>
                    <li>停止使用本服务</li>
                    <li>要求删除您的使用记录(需联系我们)</li>
                </ul>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">8. 未成年人保护</h3>
                <p className="mb-2">
                    8.1 本服务面向18岁以上的成年人。
                </p>
                <p>
                    8.2 如果我们发现收集了未成年人的信息,将立即删除相关数据。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">9. 政策更新</h3>
                <p className="mb-2">
                    9.1 我们可能会不时更新本隐私政策,更新后的政策将在服务中公布。
                </p>
                <p>
                    9.2 重大变更时,我们会通过显著方式通知您。
                </p>
            </section>

            <section>
                <h3 className="text-base font-semibold mb-2">10. 联系我们</h3>
                <p>
                    如您对本隐私政策有任何疑问或建议,或需要行使您的权利,请通过以下方式联系我们:
                </p>
                <p className="mt-2 ml-4">
                    邮箱: privacy@example.com
                </p>
            </section>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-blue-700 dark:text-blue-400 font-semibold">
                    🔒 我们承诺保护您的隐私,不会将您的个人信息用于本政策规定之外的任何目的。
                </p>
            </div>

            <p className="text-xs text-gray-500 mt-6">
                最后更新时间: 2025年12月15日
            </p>
        </div>
    );
}
