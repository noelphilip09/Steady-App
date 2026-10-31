# One-off migration applied on 2026-10-31: spliced the Couch Surfer journey slots and the weekly-contribution wording into the compiled templates. Kept for reference; not re-runnable as is.
import json, re, sys, copy
def load(app): return json.load(open(f'apps/{app}/tpl.json', encoding='utf-8'))
def save(app, t):
    with open(f'apps/{app}/tpl.json', 'w', encoding='utf-8') as f: json.dump(t, f, ensure_ascii=False, separators=(',',':'))
def is_el(n, tag=None): return isinstance(n, list) and len(n)==3 and isinstance(n[0], str) and isinstance(n[1], dict) and isinstance(n[2], list) and (tag is None or n[0]==tag)
def children(n):
    if is_el(n): return n[2]
    if isinstance(n, list): return n
    if isinstance(n, dict): return n.get('c', [])
    return []
def find_all(root, pred):
    out=[]
    def rec(n, parent, idx):
        if pred(n): out.append((n, parent, idx))
        ch = children(n)
        for i, c in enumerate(ch): rec(c, ch, i)
    rec(root, None, None); return out
def find_one(root, pred, what, strict=True):
    r = find_all(root, pred)
    if not r:
        if strict: raise SystemExit('NOT FOUND: ' + what)
        return None
    return r[0]
def text_of(n): return json.dumps(n, ensure_ascii=False)
def is_if(n, cond=None): return isinstance(n, dict) and 'if' in n and (cond is None or n['if']==cond)
def txt(n, needle): return is_el(n) and needle in text_of(n)

def patch_cs(t, strict=True):
    log=[]
    # welcome (unused) + onboarding -> slot
    root = t[0]; kids = root[2]
    for i, k in enumerate(kids):
        if is_if(k, 'csS.onboard'): kids[i] = {'slot': 'csOnboarding'}; log.append('onboarding slot')
    kids[:] = [k for k in kids if not is_if(k, 'csS.welcome')]
    # home
    r = find_one(t, lambda n: is_if(n, 'csS.home'), 'home', strict)
    if r:
        home = r[0]; screen = home['c'][0]; ch = screen[2]
        header = ch[0]; status = [k for k in ch if is_if(k) and k['if'].startswith('cur.') and k['if'] != 'cur.none']
        for st in status:
            for n,_,_ in find_all(st, lambda n: is_el(n,'p') and 'then the A$50 weekly stay fee starts' in text_of(n)):
                n[2] = ['Review the stay agreement and confirm. Nothing to pay. Once your host confirms check-in, the weekly A$50 program contribution starts: A$30 to Steady, A$20 to your savings.']
        screen[2] = [header, {'if': 'hm.stayFirst', 'c': status}, {'slot': 'homeSearch'}, {'slot': 'homeSections'}]
        log.append('home rebuilt (%d status cards kept)' % len(status))
    # passport header
    r = find_one(t, lambda n: is_if(n, 'csS.passport'), 'passport', strict)
    if r:
        screen = r[0]['c'][0]; ch = screen[2]
        assert is_el(ch[0]) and 'row start' in str(ch[0][1].get('class')) and ch[1][1].get('class') == 'statgrid', 'passport header shape'
        screen[2] = [{'slot': 'ppHeader'}] + ch[2:]; log.append('passport header slot')
    # payments -> savings + new screens
    r = find_one(t, lambda n: is_if(n, 'csS.payments'), 'payments', strict)
    if r:
        parent, idx = r[1], r[2]
        parent[idx:idx+1] = [{'slot': 'csSavings'}, {'slot': 'csResults'}, {'slot': 'csHousing'}, {'slot': 'csEducation'}, {'slot': 'csCourse'}, {'slot': 'csMilestones'}]
        log.append('payments replaced by savings + 5 new screens')
    # more
    r = find_one(t, lambda n: is_if(n, 'csS.more'), 'more', strict)
    if r: r[1][r[2]] = {'slot': 'csMore'}; log.append('more slot')
    # tab bar (the cs one: contains csGoHome)
    r = find_one(t, lambda n: is_el(n, 'nav') and n[1].get('class') == 'tabbar' and 'csGoHome' in text_of(n), 'cs tabbar', strict)
    if r: r[1][r[2]] = {'slot': 'csTabbar'}; log.append('tabbar slot')
    # modals: before M.isDemo
    r = find_one(t, lambda n: is_if(n, 'M.isDemo'), 'modal demo', strict)
    if r and not any(isinstance(x, dict) and x.get('slot') == 'csModals' for x in r[1]): r[1].insert(r[2], {'slot': 'csModals'}); log.append('modals slot')
    # request step 3
    r = find_one(t, lambda n: is_if(n, 'rq.s3'), 'request step 3', strict)
    if r:
        s3 = r[0]; keep_err = [x for x in s3['c'] if is_if(x, 'payErrShown')]; submit = [x for x in s3['c'] if is_el(x, 'button') and 'submitRequest' in text_of(x)]
        s3['c'] = [['h1', {'class': 'h2'}, ['Nothing to pay']], ['p', {'class': 'sub'}, ['Steady stays are funded by the program. Here is how the weekly contribution works.']], {'slot': 'rqContribution'}] + keep_err + submit
        log.append('request step 3 rewritten')
    for n,_,_ in find_all(t, lambda n: is_el(n, 'button') and n[2] == ['Continue to costs']): n[2] = ['Continue']
    # listing pricebox
    r = find_one(t, lambda n: is_el(n, 'div') and n[1].get('class') == 'pricebox' and 'Weekly stay fee (to Steady)' in text_of(n) and 'Your membership' in text_of(n), 'listing pricebox', strict)
    if r:
        row = lambda a, b: ['div', {'class': 'row between'}, [['span', {'class': 'small'}, [a]], ['b', {}, [b]]]]
        r[0][2] = [row('Weekly program contribution', 'A$50 per stay week'), row('Of which your savings', 'A$20 a week, yours to keep'), row('Rent to host', 'None. Host receives a government subsidy'), row('You pay', 'Nothing')]
        log.append('listing pricebox rewritten')
    # stay screen kv rows
    for n,parent,idx in find_all(t, lambda n: is_el(n, 'div') and n[1].get('class') == 'kv' and 'Weekly stay fee' in text_of(n) and 'cur.feeStatus' in text_of(n)):
        n[2] = [['span', {}, ['Weekly contribution']], ['b', {}, ['A$50 per stay week · ', {'$': 'cur.feeStatus'}]]]; log.append('stay kv contribution')
    for n,parent,idx in find_all(t, lambda n: is_el(n, 'div') and n[1].get('class') == 'kv' and n[2] and is_el(n[2][0]) and n[2][0][2] == ['Membership'] and 'subSummary' in text_of(n)):
        parent.remove(n); log.append('stay kv membership removed')
    patch_agreement(t, log, 'your savings')
    return log

def patch_agreement(t, log, whose):
    for n,_,_ in find_all(t, lambda n: is_el(n, 'div') and n[1].get('class') == 'kv' and n[2] and is_el(n[2][0]) and n[2][0][2] == ['Weekly stay fee'] and 'charged from check-in' in text_of(n)):
        n[2] = [['span', {}, ['Weekly program contribution']], ['b', {}, ['A$50 per stay week: A$30 Steady service, A$20 to ' + whose]]]; log.append('agreement kv contribution')
    for n,_,_ in find_all(t, lambda n: is_el(n, 'div') and n[1].get('class') == 'kv' and n[2] and is_el(n[2][0]) and n[2][0][2] == ['Charged now']):
        n[2] = [['span', {}, ['Rent or fees payable']], ['b', {}, ['None']]]; log.append('agreement kv charged now')
    for n,_,_ in find_all(t, lambda n: is_el(n, 'p') and 'the weekly stay fee schedule' in text_of(n)):
        n[2] = [x.replace('the weekly stay fee schedule', 'the weekly contribution schedule') if isinstance(x, str) else x for x in n[2]]; log.append('agreement confirm text')

def patch_host(t):
    log=[]
    for n,_,_ in find_all(t, lambda n: is_el(n, 'div') and 'guest memberships and weekly stay fees' in text_of(n) and len(text_of(n)) < 400):
        n[2] = ['• Steady’s own revenue (A$30 of each weekly A$50 program contribution, plus memberships) is separate and never part of your subsidy. The other A$20 a week is credited to your guest’s own savings. Subsidy payments are government expenditure and need program approval plus verified occupancy.']; log.append('host subsidy explainer')
    patch_agreement(t, log, 'the guest’s savings')
    return log

def patch_dashboard(t):
    log=[]
    for n,_,_ in find_all(t, lambda n: is_el(n, 'p') and 'Platform revenue (memberships and weekly stay fees)' in text_of(n)):
        n[2] = ['Actual expenditure from ledgers; counterfactual and savings are estimates under stated assumptions. Steady’s service contributions (A$30 of each weekly A$50 program contribution, plus memberships) are the operator’s business revenue, reported separately and never counted as a saving. The A$20 participant savings share is shown separately and belongs to participants.']; log.append('finance intro')
    r = find_one(t, lambda n: is_el(n, 'div') and n[1].get('class') == 'kpi' and 'Weekly stay fees collected' in text_of(n), 'fee kpi')
    kpi, parent, idx = r
    kpi[2] = [['span', {'class': 'lab'}, ['Steady service contributions (A$30 a week)']], ['span', {'class': 'val money', 'style': 'font-size: 24px'}, [{'$': 'rev.feeService'}]], ['span', {'class': 'foot'}, [{'$': 'rev.feeCount'}, ' stay weeks · ', {'$': 'rev.feeFailed'}, ' processing · ', {'$': 'rev.feeRefunded'}, ' refunded']]]
    parent.insert(idx + 1, ['div', {'class': 'kpi'}, [['span', {'class': 'lab'}, ['Participant savings credited (A$20 a week)']], ['span', {'class': 'val money', 'style': 'font-size: 24px'}, [{'$': 'rev.savingsCredited'}]], ['span', {'class': 'foot'}, ['Belongs to participants; redeemable any time · not revenue, not a program saving']]]])
    log.append('fee kpi split')
    for n,_,_ in find_all(t, lambda n: is_el(n, 'label') and n[2] == ['Weekly stay fee (A$ per eligible week, platform revenue)']):
        n[2] = ['Weekly program contribution (A$ per stay week: A$30 Steady service, A$20 participant savings)']; log.append('settings label')
    patch_agreement(t, log, 'the couch surfer’s savings')
    return log

if __name__ == '__main__':
    t = load('couchsurfer'); print('couchsurfer:', patch_cs(t)); save('couchsurfer', t)
    t = load('host'); print('host:', patch_host(t)); save('host', t)
    t = load('dashboard'); print('dashboard:', patch_dashboard(t)); save('dashboard', t)
    t = load('demo'); print('demo:', patch_cs(t, strict=False)); print('demo host:', patch_host(t)); save('demo', t)
    for app in ['couchsurfer','host','dashboard','demo']:
        s = open(f'apps/{app}/tpl.json', encoding='utf-8').read(); json.loads(s)
        left = len(re.findall(r'stay fee', s, re.I)); print(app, 'bytes', len(s), 'remaining "stay fee" mentions:', left)